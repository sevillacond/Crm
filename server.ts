import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import crypto from 'crypto';

import { checkDatabaseConnection } from './src/db/client.ts';
import { runMigrations } from './src/db/migrate.ts';
import { seedDatabase } from './src/db/seed/seed.ts';
import { apiRoutes } from './src/api/routes/index.ts';
import { healthRoutes } from './src/api/routes/health.routes.ts';
import { errorHandler } from './src/api/middlewares/errorHandler.middleware.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// -------------------------------------------------------------
// HTTP SECURITY & PARSERS
// -------------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: false, // Permite Vite SPA scripts e assets em dev/preview
    crossOriginEmbedderPolicy: false
  })
);
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Correlation ID & Request Context Middleware
app.use((req: Request, _res: Response, next) => {
  req.requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  next();
});

// -------------------------------------------------------------
// ROUTES
// -------------------------------------------------------------
// Health Check & Readiness Endpoints
app.use('/health', healthRoutes);

// Modular Core CRM API
app.use('/api', apiRoutes);

// -------------------------------------------------------------
// GLOBAL ERROR HANDLER
// -------------------------------------------------------------
app.use(errorHandler);

// -------------------------------------------------------------
// VITE DEV MIDDLEWARE OR PRODUCTION STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  console.log('[Enlace-CRM] Inicializando subsistemas do CRM...');

  // 1. Verificar conexão com PostgreSQL 16
  const isPostgresReady = await checkDatabaseConnection();
  if (isPostgresReady) {
    try {
      console.log('[Enlace-CRM] PostgreSQL 16 detectado. Verificando migrações...');
      await runMigrations();
      await seedDatabase();
    } catch (err: any) {
      console.warn('[Enlace-CRM] Aviso durante inicialização de schema:', err.message);
    }
  } else {
    console.log('[Enlace-CRM] Executando com camada de persistência local resiliente.');
  }

  // 2. Vite Middleware ou Servidor Estático
  if (process.env.NODE_ENV !== 'production') {
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

  // 3. Listener HTTP
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Enlace-CRM] Servidor ativo na porta ${PORT} | PostgreSQL 16 Drizzle ORM`);
  });
}

startServer().catch((err) => {
  console.error('[Enlace-CRM] Falha crítica ao iniciar servidor:', err);
});
