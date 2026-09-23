import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { env } from '../../config/env.ts';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

if (env.REDIS_URL || process.env.REDIS_HOST) {
  try {
    const redisUrl = env.REDIS_URL || `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true
    });

    redisClient.connect()
      .then(() => {
        isRedisAvailable = true;
        console.log('[Redis] Conectado com sucesso para Rate Limiting distribuído.');
      })
      .catch((err) => {
        isRedisAvailable = false;
        console.warn('[Redis] Indisponível para rate limiting, utilizando rate limiter em memória:', err.message);
      });

    redisClient.on('error', () => {
      isRedisAvailable = false;
    });
  } catch (err: any) {
    console.warn('[Redis] Falha de inicialização:', err.message);
  }
}

// Memory fallback store
const memoryStores = new Map<string, Map<string, { count: number; resetAt: number }>>();

export function createRateLimiter(options: {
  name: string;
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  const { name, windowMs, max, message } = options;
  if (!memoryStores.has(name)) {
    memoryStores.set(name, new Map());
  }
  const store = memoryStores.get(name)!;

  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const key = options.keyGenerator ? options.keyGenerator(req) : `${name}:${ip}`;
    const windowSeconds = Math.ceil(windowMs / 1000);

    // 1. Try Redis first if available
    if (isRedisAvailable && redisClient) {
      try {
        const redisKey = `ratelimit:${name}:${key}`;
        const current = await redisClient.incr(redisKey);
        if (current === 1) {
          await redisClient.expire(redisKey, windowSeconds);
        }

        if (current > max) {
          const ttl = await redisClient.ttl(redisKey);
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
        // Fall through to memory store if Redis query fails
      }
    }

    // 2. Memory store fallback
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
  message: 'Muitas tentativas de login a partir deste IP. Bloqueado temporariamente por 15 minutos.'
});

export const apiGeneralRateLimiter = createRateLimiter({
  name: 'api_general',
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  message: 'Limite geral de tráfego na API excedido.'
});

export const maiaRateLimiter = createRateLimiter({
  name: 'maia_copilot',
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Limite de consultas simultâneas ao copiloto MaIA excedido.',
  keyGenerator: (req) => `${req.user?.id || req.ip}`
});

export const viabilidadeRateLimiter = createRateLimiter({
  name: 'viabilidade_consulta',
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Limite de consultas de viabilidade por minuto excedido.'
});
