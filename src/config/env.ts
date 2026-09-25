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
  PROVIDER_CNPJ?: string;
  PROVIDER_RAZAO_SOCIAL?: string;
  PROVIDER_NOME_FANTASIA?: string;
  PROVIDER_CIDADE?: string;
  PROVIDER_UF?: string;
  GEMINI_API_KEY?: string;
}

const FORBIDDEN_PASSWORDS = [
  'change_me',
  'mudarurgente@2026!',
  'enlace@2026!',
  'devadmin@2026!',
  'password',
  'admin',
  '123456',
  'root',
  'teste'
];

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

  // 3. Admin Initial Password validation (P0/P1: Eliminar completamente senhas default de produção)
  const adminInitialPassword = envSource.ADMIN_INITIAL_PASSWORD;
  if (isProduction) {
    if (!adminInitialPassword || adminInitialPassword.trim() === '') {
      failFast('[FATAL] Em ambiente de PRODUÇÃO, ADMIN_INITIAL_PASSWORD é estritamente obrigatória para inicialização do administrador raiz.');
    }
    if (FORBIDDEN_PASSWORDS.includes(adminInitialPassword!.toLowerCase().trim())) {
      failFast('[FATAL] Em ambiente de PRODUÇÃO, o uso de senhas padrão/conhecidas em ADMIN_INITIAL_PASSWORD é estritamente proibido.');
    }
  }

  // 4. Instance ID validation (P0: Eliminar fallback silencioso em produção)
  const instanceId = envSource.INSTANCE_ID || envSource.VITE_INSTANCE_ID;
  if (isProduction) {
    if (!instanceId || instanceId.trim() === '') {
      failFast('[FATAL] Em ambiente de PRODUÇÃO, INSTANCE_ID é obrigatório para definir o identificador isolado do provedor.');
    }
    if (['inst-enlace-fibra-001', 'inst_enlace_sp_001', 'inst-dev-local-001'].includes(instanceId!.trim())) {
      failFast('[FATAL] Em ambiente de PRODUÇÃO, o uso de IDs de instância padrão de demonstração é estritamente proibido.');
    }
  }

  // 5. Admin Initial Email validation (P1: Eliminar identidade default em produção)
  const adminInitialEmail = envSource.ADMIN_INITIAL_EMAIL;
  if (isProduction) {
    if (!adminInitialEmail || adminInitialEmail.trim() === '') {
      failFast('[FATAL] Em ambiente de PRODUÇÃO, ADMIN_INITIAL_EMAIL é obrigatório.');
    }
    if (adminInitialEmail!.toLowerCase().trim() === 'admin@enlace.net.br') {
      failFast('[FATAL] Em ambiente de PRODUÇÃO, o e-mail padrão de demonstração admin@enlace.net.br é estritamente proibido.');
    }
  }

  // 6. Provider Identity validation (P1: Bootstrap sem dados padrão em produção)
  const providerCnpj = envSource.PROVIDER_CNPJ;
  const providerRazaoSocial = envSource.PROVIDER_RAZAO_SOCIAL;
  const providerNomeFantasia = envSource.PROVIDER_NOME_FANTASIA;
  const providerCidade = envSource.PROVIDER_CIDADE;
  const providerUf = envSource.PROVIDER_UF;

  if (isProduction) {
    if (!providerCnpj || providerCnpj.trim() === '' || providerCnpj.trim() === '45.123.890/0001-92' || providerCnpj.trim() === '14.892.341/0001-90') {
      failFast('[FATAL] Em ambiente de PRODUÇÃO, PROVIDER_CNPJ é obrigatório e não pode ser o CNPJ de demonstração.');
    }
    if (!providerRazaoSocial || providerRazaoSocial.trim() === '' || providerRazaoSocial.trim() === 'Enlace Telecomunicações e Fibra Óptica Ltda') {
      failFast('[FATAL] Em ambiente de PRODUÇÃO, PROVIDER_RAZAO_SOCIAL é obrigatória e não pode ser a Razão Social de demonstração.');
    }
    if (!providerNomeFantasia || providerNomeFantasia.trim() === '' || providerNomeFantasia.trim() === 'Enlace Fibra') {
      failFast('[FATAL] Em ambiente de PRODUÇÃO, PROVIDER_NOME_FANTASIA é obrigatório e não pode ser o Nome Fantasia de demonstração.');
    }
    if (!providerCidade || providerCidade.trim() === '') {
      failFast('[FATAL] Em ambiente de PRODUÇÃO, PROVIDER_CIDADE é obrigatória.');
    }
    if (!providerUf || providerUf.trim() === '') {
      failFast('[FATAL] Em ambiente de PRODUÇÃO, PROVIDER_UF é obrigatória.');
    }
  }

  // 7. CORS Origins validation (P0.5: Obrigatório em produção, sem fallback para localhost)
  const rawCorsOrigins = envSource.CORS_ORIGINS || '';
  let corsOrigins: string[] = [];
  if (isProduction) {
    if (!rawCorsOrigins || rawCorsOrigins.trim() === '') {
      failFast('[FATAL] Em ambiente de PRODUÇÃO, a variável CORS_ORIGINS é estritamente obrigatória.');
    }
    corsOrigins = rawCorsOrigins.split(',').map((o: string) => o.trim()).filter(Boolean);
    if (corsOrigins.length === 0) {
      failFast('[FATAL] Em ambiente de PRODUÇÃO, CORS_ORIGINS deve conter ao menos uma origem válida.');
    }
    if (corsOrigins.some(o => o.includes('localhost') || o.includes('127.0.0.1'))) {
      failFast('[FATAL] Em ambiente de PRODUÇÃO, CORS_ORIGINS não pode conter localhost ou 127.0.0.1 como fallback produtivo.');
    }
  } else {
    corsOrigins = rawCorsOrigins
      ? rawCorsOrigins.split(',').map((o: string) => o.trim()).filter(Boolean)
      : ['http://localhost:3000', 'http://127.0.0.1:3000'];
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    JWT_SECRET: jwtSecret!,
    DATABASE_URL: databaseUrl,
    REDIS_URL: envSource.REDIS_URL,
    CORS_ORIGINS: corsOrigins,
    INSTANCE_ID: instanceId,
    ADMIN_INITIAL_EMAIL: adminInitialEmail,
    ADMIN_INITIAL_PASSWORD: adminInitialPassword,
    PROVIDER_CNPJ: providerCnpj,
    PROVIDER_RAZAO_SOCIAL: providerRazaoSocial,
    PROVIDER_NOME_FANTASIA: providerNomeFantasia,
    PROVIDER_CIDADE: providerCidade,
    PROVIDER_UF: providerUf,
    GEMINI_API_KEY: envSource.GEMINI_API_KEY
  };
}

export const env = validateEnv();
