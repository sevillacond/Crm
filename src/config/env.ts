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
  ADMIN_INITIAL_EMAIL?: string;
  ADMIN_INITIAL_PASSWORD?: string;
  GEMINI_API_KEY?: string;
}

export function validateEnv(overrideEnv?: Record<string, string | undefined>): AppConfig {
  const envSource = overrideEnv || process.env;
  const nodeEnv = (envSource.NODE_ENV || 'development') as 'development' | 'production' | 'test';
  const port = Number(envSource.PORT) || 3000;
  const isProduction = nodeEnv === 'production';

  const failFast = (msg: string) => {
    if (overrideEnv) {
      throw new Error(msg);
    }
    console.error(msg);
    process.exit(1);
  };

  // 1. JWT Secret validation (P0: Fail-Fast)
  let jwtSecret = envSource.JWT_SECRET;
  if (!jwtSecret || jwtSecret === 'CHANGE_ME' || jwtSecret.trim() === '') {
    if (isProduction) {
      failFast('[FATAL] Em ambiente de PRODUÇÃO, a variável JWT_SECRET é estritamente obrigatória e não pode ser padrão.');
    } else {
      jwtSecret = 'dev_only_insecure_jwt_secret_must_be_set_in_production_32char';
      console.warn('[SECURITY WARNING] JWT_SECRET não configurado. Utilizando chave de desenvolvimento local.');
    }
  }

  // 2. Database URL validation (P0: Fail-Fast)
  const databaseUrl = envSource.DATABASE_URL || '';
  if (!databaseUrl || databaseUrl.includes('CHANGE_ME')) {
    if (isProduction) {
      failFast('[FATAL] Em ambiente de PRODUÇÃO, a variável DATABASE_URL é estritamente obrigatória para conexão ao PostgreSQL 16.');
    } else {
      console.warn('[STORAGE NOTICE] DATABASE_URL não configurada em dev. Modo desenvolvimento/teste ativo.');
    }
  }

  // 3. Admin Initial Password validation (P0: Eliminar completamente senhas default de produção)
  const adminInitialPassword = envSource.ADMIN_INITIAL_PASSWORD;
  if (isProduction) {
    if (!adminInitialPassword || adminInitialPassword === 'CHANGE_ME' || adminInitialPassword === 'MudarUrgente@2026!' || adminInitialPassword.trim() === '') {
      failFast('[FATAL] Em ambiente de PRODUÇÃO, ADMIN_INITIAL_PASSWORD é estritamente obrigatória para inicialização do administrador raiz (senhas default proibidas).');
    }
  }

  // 4. Instance ID validation (P0: Eliminar fallback silencioso em produção)
  const instanceId = envSource.INSTANCE_ID || envSource.VITE_INSTANCE_ID;
  if (isProduction) {
    if (!instanceId || instanceId.trim() === '') {
      failFast('[FATAL] Em ambiente de PRODUÇÃO, INSTANCE_ID é obrigatório para definir o identificador isolado do provedor.');
    }
  }

  // 5. CORS Origins validation
  const rawCorsOrigins = envSource.CORS_ORIGINS || '';
  const corsOrigins = rawCorsOrigins
    ? rawCorsOrigins.split(',').map((o: string) => o.trim()).filter(Boolean)
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    JWT_SECRET: jwtSecret!,
    DATABASE_URL: databaseUrl,
    REDIS_URL: envSource.REDIS_URL,
    CORS_ORIGINS: corsOrigins,
    INSTANCE_ID: instanceId,
    ADMIN_INITIAL_EMAIL: envSource.ADMIN_INITIAL_EMAIL,
    ADMIN_INITIAL_PASSWORD: adminInitialPassword,
    GEMINI_API_KEY: envSource.GEMINI_API_KEY
  };
}

export const env = validateEnv();
