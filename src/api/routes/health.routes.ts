import { Router, Request, Response } from 'express';
import { isDbConnected } from '../../db/client.ts';
import { env } from '../../config/env.ts';
import { sgpAdapter } from '../../integrations/sgp/sgp.adapter.ts';
import { whatsappAdapter } from '../../integrations/whatsapp/whatsapp.adapter.ts';

const router = Router();

// Liveness handler: checks if the Node.js process is responsive
const livenessHandler = (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
};

// Readiness handler: checks if PostgreSQL and critical components are available
const readinessHandler = (_req: Request, res: Response) => {
  const dbReady = isDbConnected();
  const isProduction = env.NODE_ENV === 'production';

  // In production, database is strictly required
  if (isProduction && !dbReady) {
    res.status(503).json({
      status: 'not_ready',
      ready: false,
      reason: 'PostgreSQL 16 indisponível. Conexão obrigatória em produção.',
      database: {
        engine: 'PostgreSQL 16',
        connected: false
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.status(200).json({
    status: 'ready',
    ready: true,
    environment: env.NODE_ENV,
    database: {
      engine: 'PostgreSQL 16',
      connected: dbReady,
      mode: dbReady ? 'POSTGRESQL_OFFICIAL' : 'DEVELOPMENT_DEMO_STORAGE'
    },
    integrations: {
      sgp: { configurado: sgpAdapter.isConfigurado() },
      whatsapp: { configurado: whatsappAdapter.isConfigurado() }
    },
    timestamp: new Date().toISOString()
  });
};

// Liveness routes
router.get('/live', livenessHandler);
router.get('/liveness', livenessHandler);

// Readiness routes
router.get('/ready', readinessHandler);
router.get('/readiness', readinessHandler);

// Root health check
router.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'enlace-telecom-crm',
    version: '1.2.0-hardened',
    environment: env.NODE_ENV,
    status: isDbConnected() ? 'healthy' : (env.NODE_ENV === 'production' ? 'degraded' : 'healthy_dev'),
    timestamp: new Date().toISOString()
  });
});

export const healthRoutes = router;
