import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';
import crypto from 'crypto';

import { env } from './src/config/env.ts';
import { checkDatabaseConnection } from './src/db/client.ts';
import { runMigrations } from './src/db/migrate.ts';
import { seedDatabase } from './src/db/seed/seed.ts';
import { apiRoutes } from './src/api/routes/index.ts';
import { healthRoutes } from './src/api/routes/health.routes.ts';
import { errorHandler } from './src/api/middlewares/errorHandler.middleware.ts';
import {
  apiGeneralRateLimiter,
  loginRateLimiter,
  maiaRateLimiter,
  viabilidadeRateLimiter
} from './src/api/middlewares/rateLimiter.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = env.PORT;

// -------------------------------------------------------------
// HTTP SECURITY & PARSERS
// -------------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Vite SPA scripts and assets in dev/preview
    crossOriginEmbedderPolicy: false
  })
);

// P0.10: Restrictive CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // In development, allow requests without origin (curl, mobile) or matching dev ports
      if (!origin || env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      if (env.CORS_ORIGINS.length > 0 && env.CORS_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origem CORS '${origin}' não autorizada por política de segurança.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id']
  })
);

app.use(express.json({ limit: '5mb' }));

// Correlation ID & Request Context Middleware
app.use((req: Request, _res: Response, next) => {
  req.requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  next();
});

// -------------------------------------------------------------
// RATE LIMITING (P0.11 & P0.16)
// -------------------------------------------------------------
app.use('/api/auth/login', loginRateLimiter);
app.use('/api/maia', maiaRateLimiter);
app.use('/api/viabilidade', viabilidadeRateLimiter);
app.use('/api', apiGeneralRateLimiter);

// -------------------------------------------------------------
// ROUTES
// -------------------------------------------------------------
// Health, Liveness & Readiness Endpoints (Section 23)
app.use('/health', healthRoutes);
app.use('/liveness', (_req, res) => res.status(200).json({ status: 'alive' }));
app.use('/readiness', healthRoutes);

// Core Modular API
app.use('/api', apiRoutes);

// -------------------------------------------------------------
// GLOBAL ERROR HANDLER
// -------------------------------------------------------------
app.use(errorHandler);

// -------------------------------------------------------------
// VITE DEV MIDDLEWARE OR PRODUCTION STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  console.log(`[Enlace-CRM] Inicializando em modo: ${env.NODE_ENV.toUpperCase()}...`);

  // 1. PostgreSQL 16 verification
  const isPostgresReady = await checkDatabaseConnection();
  if (isPostgresReady) {
    try {
      console.log('[Enlace-CRM] PostgreSQL 16 conectado com sucesso. Executando migrações...');
      await runMigrations();
      await seedDatabase();
    } catch (err: any) {
      console.error('[Enlace-CRM] Erro durante inicialização do banco:', err.message);
      if (env.NODE_ENV === 'production') {
        console.error('[FATAL] Falha de migração em produção. Abortando inicialização.');
        process.exit(1);
      }
    }
  } else {
    if (env.NODE_ENV === 'production') {
      console.error('[FATAL] PostgreSQL 16 é OBRIGATÓRIO em produção. Inicialização interrompida (Fail Fast).');
      process.exit(1);
    } else {
      console.warn('[Enlace-CRM] Modo de desenvolvimento local: Banco PostgreSQL indisponível, simulador dev ativo.');
    }
  }

  // 2. Vite Middleware or Production Static Serving
  if (env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  // 3. HTTP Listener
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Enlace-CRM] Servidor operacional na porta ${PORT} | PostgreSQL 16 Drizzle ORM`);
  });
}

startServer().catch((err) => {
  console.error('[Enlace-CRM] Falha crítica de inicialização:', err);
  process.exit(1);
});
