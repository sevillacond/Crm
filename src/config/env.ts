import dotenv from 'dotenv';
dotenv.config();

export interface AppConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  JWT_SECRET: string;
  DATABASE_URL: string;
  REDIS_URL?: string;
  CORS_ORIGINS: string[];
  INSTANCE_ID?: string;
  GEMINI_API_KEY?: string;
}

export function validateEnv(): AppConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
  const port = Number(process.env.PORT) || 3000;
  const isProduction = nodeEnv === 'production';

  // JWT Secret validation
  let jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret === 'CHANGE_ME' || jwtSecret.trim() === '') {
    if (isProduction) {
      console.error('[FATAL] Em ambiente de PRODUÇÃO, a variável JWT_SECRET é estritamente obrigatória e não pode ser padrão.');
      process.exit(1);
    } else {
      // In dev/test only, enforce a specific local dev key if not provided
      jwtSecret = 'dev_only_insecure_jwt_secret_must_be_set_in_production_32char';
      console.warn('[SECURITY WARNING] JWT_SECRET não configurado. Utilizando chave de desenvolvimento local.');
    }
  }

  // Database URL validation
  const databaseUrl = process.env.DATABASE_URL || '';
  if (!databaseUrl || databaseUrl.includes('CHANGE_ME')) {
    if (isProduction) {
      console.error('[FATAL] Em ambiente de PRODUÇÃO, a variável DATABASE_URL é estritamente obrigatória para conexão ao PostgreSQL 16.');
      process.exit(1);
    } else {
      console.warn('[STORAGE NOTICE] DATABASE_URL não configurada em dev. Modo desenvolvimento/teste ativo.');
    }
  }

  // CORS Origins validation
  const rawCorsOrigins = process.env.CORS_ORIGINS || '';
  const corsOrigins = rawCorsOrigins
    ? rawCorsOrigins.split(',').map((o) => o.trim()).filter(Boolean)
    : isProduction
    ? [] // In production, must be explicitly provided
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'];

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    JWT_SECRET: jwtSecret,
    DATABASE_URL: databaseUrl,
    REDIS_URL: process.env.REDIS_URL,
    CORS_ORIGINS: corsOrigins,
    INSTANCE_ID: process.env.VITE_INSTANCE_ID || process.env.INSTANCE_ID,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
  };
}

export const env = validateEnv();
