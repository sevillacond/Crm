import Redis from 'ioredis';
import { env } from '../config/env.ts';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

// Fallback in-memory store for development/test environments
const memoryLockoutStore = new Map<string, { count: number; lockedUntil: number; resetAt: number }>();

export function initRedis(): Redis | null {
  if (redisClient) return redisClient;

  if (env.REDIS_URL || process.env.REDIS_HOST) {
    try {
      const redisUrl = env.REDIS_URL || `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        lazyConnect: true
      });

      redisClient
        .connect()
        .then(() => {
          isRedisAvailable = true;
          console.log('[Redis] Conexão operacional com Redis para Rate Limiting & Proteção contra Brute Force.');
        })
        .catch((err) => {
          isRedisAvailable = false;
          if (env.NODE_ENV === 'production') {
            console.warn('[Redis] [ALERTA DE PRODUÇÃO] Redis indisponível. Ativando política de contenção local:', err.message);
          }
        });

      redisClient.on('error', (err) => {
        isRedisAvailable = false;
      });

      redisClient.on('ready', () => {
        isRedisAvailable = true;
      });
    } catch (err: any) {
      console.warn('[Redis] Erro ao instanciar cliente Redis:', err.message);
    }
  }

  return redisClient;
}

// Initialize on module load
initRedis();

export function getRedisClient(): Redis | null {
  return redisClient;
}

export function isRedisConnected(): boolean {
  return isRedisAvailable && !!redisClient;
}

/**
 * Brute force lockout check
 */
export async function checkLoginLockout(
  key: string
): Promise<{ locked: boolean; waitSeconds: number }> {
  if (isRedisConnected() && redisClient) {
    try {
      const lockKey = `auth:lockout:${key}`;
      const ttl = await redisClient.ttl(lockKey);
      if (ttl > 0) {
        return { locked: true, waitSeconds: ttl };
      }
      return { locked: false, waitSeconds: 0 };
    } catch (err) {
      // Fall through to memory store
    }
  }

  const now = Date.now();
  const entry = memoryLockoutStore.get(key);
  if (entry && entry.lockedUntil > now) {
    const waitSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
    return { locked: true, waitSeconds };
  }

  return { locked: false, waitSeconds: 0 };
}

/**
 * Record a failed login attempt with Redis atomic operations
 */
export async function recordFailedLogin(
  key: string,
  maxAttempts: number = 5,
  lockDurationSeconds: number = 300 // 5 minutes
): Promise<{ count: number; locked: boolean; waitSeconds: number }> {
  if (isRedisConnected() && redisClient) {
    try {
      const attemptKey = `auth:attempts:${key}`;
      const lockKey = `auth:lockout:${key}`;

      const count = await redisClient.incr(attemptKey);
      if (count === 1) {
        await redisClient.expire(attemptKey, lockDurationSeconds);
      }

      if (count >= maxAttempts) {
        await redisClient.set(lockKey, 'LOCKED', 'EX', lockDurationSeconds);
        await redisClient.del(attemptKey);
        return { count, locked: true, waitSeconds: lockDurationSeconds };
      }

      return { count, locked: false, waitSeconds: 0 };
    } catch (err) {
      // Fall through to memory store
    }
  }

  // Memory fallback
  const now = Date.now();
  const entry = memoryLockoutStore.get(key) || { count: 0, lockedUntil: 0, resetAt: now + lockDurationSeconds * 1000 };

  if (entry.resetAt <= now) {
    entry.count = 1;
    entry.resetAt = now + lockDurationSeconds * 1000;
  } else {
    entry.count += 1;
  }

  if (entry.count >= maxAttempts) {
    entry.lockedUntil = now + lockDurationSeconds * 1000;
    memoryLockoutStore.set(key, entry);
    return { count: entry.count, locked: true, waitSeconds: lockDurationSeconds };
  }

  memoryLockoutStore.set(key, entry);
  return { count: entry.count, locked: false, waitSeconds: 0 };
}

/**
 * Clear failed login attempts on successful login
 */
export async function clearFailedLogin(key: string): Promise<void> {
  if (isRedisConnected() && redisClient) {
    try {
      const attemptKey = `auth:attempts:${key}`;
      const lockKey = `auth:lockout:${key}`;
      await redisClient.del(attemptKey, lockKey);
    } catch {
      // Ignore
    }
  }

  memoryLockoutStore.delete(key);
}
