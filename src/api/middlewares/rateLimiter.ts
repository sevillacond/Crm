import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.ts';
import { getRedisClient, isRedisConnected } from '../../shared/redis.ts';

// Memory fallback store (Defense in depth)
const memoryStores = new Map<string, Map<string, { count: number; resetAt: number }>>();

export function createRateLimiter(options: {
  name: string;
  windowMs: number;
  max: number;
  message?: string;
  failClosedInProduction?: boolean;
  keyGenerator?: (req: Request) => string;
}) {
  const { name, windowMs, max, message, failClosedInProduction = false } = options;
  if (!memoryStores.has(name)) {
    memoryStores.set(name, new Map());
  }
  const store = memoryStores.get(name)!;

  return async (req: Request, res: Response, next: NextFunction) => {
    // P0.19: Utiliza req.ip derivado com segurança do proxy confiável configurado
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const key = options.keyGenerator ? options.keyGenerator(req) : `${name}:${ip}`;
    const windowSeconds = Math.ceil(windowMs / 1000);

    // 1. Try Redis first if available
    const redis = getRedisClient();
    const redisActive = isRedisConnected() && redis;

    if (redisActive) {
      try {
        const redisKey = `ratelimit:${name}:${key}`;
        const current = await redis.incr(redisKey);
        if (current === 1) {
          await redis.expire(redisKey, windowSeconds);
        }

        if (current > max) {
          const ttl = await redis.ttl(redisKey);
          res.set('Retry-After', String(ttl > 0 ? ttl : windowSeconds));
          res.status(429).json({
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: message || `Limite de requisições excedido. Tente novamente em ${ttl} segundos.`
            }
          });
          return;
        }

        res.set('X-RateLimit-Limit', String(max));
        res.set('X-RateLimit-Remaining', String(Math.max(0, max - current)));
        return next();
      } catch (err) {
        console.warn(`[RateLimiter:${name}] Erro ao consultar Redis:`, err);
      }
    }

    // 2. Política de Falha Fechada (FAIL CLOSED) em Produção para Operações Críticas
    if (failClosedInProduction && env.NODE_ENV === 'production' && !redisActive && env.REDIS_URL) {
      res.status(503).json({
        error: {
          code: 'RATE_LIMITER_FAIL_CLOSED',
          message: 'Serviço de autenticação temporariamente restrito por política de segurança de contenção (Redis indisponível).'
        }
      });
      return;
    }

    // 3. Fallback de Memória Local com Janela Deslizante (Defesa em Profundidade)
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      res.set('X-RateLimit-Limit', String(max));
      res.set('X-RateLimit-Remaining', String(max - 1));
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      const waitSeconds = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(waitSeconds));
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: message || `Limite de requisições excedido. Tente novamente em ${waitSeconds} segundos.`
        }
      });
      return;
    }

    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(max - entry.count));
    next();
  };
}

// Pre-configured rate limiters
export const loginRateLimiter = createRateLimiter({
  name: 'auth_login',
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  failClosedInProduction: true, // FAIL CLOSED se Redis configurado e indisponível em produção
  message: 'Muitas tentativas de login a partir deste IP. Bloqueado temporariamente por 15 minutos.'
});

export const apiGeneralRateLimiter = createRateLimiter({
  name: 'api_general',
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  failClosedInProduction: false,
  message: 'Limite geral de tráfego na API excedido.'
});

export const maiaRateLimiter = createRateLimiter({
  name: 'maia_copilot',
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  failClosedInProduction: true, // P0 PARTE 17: Operações sensíveis da MaIA bloqueadas se Redis indisponível em produção
  message: 'Limite de consultas simultâneas ao copiloto MaIA excedido.',
  keyGenerator: (req) => `${req.user?.id || req.actor?.userId || req.ip}`
});

export const viabilidadeRateLimiter = createRateLimiter({
  name: 'viabilidade_consulta',
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  failClosedInProduction: false,
  message: 'Limite de consultas de viabilidade por minuto excedido.'
});
