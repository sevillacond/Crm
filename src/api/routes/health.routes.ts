import { Router, Request, Response } from 'express';
import { isDbConnected } from '../../db/client.ts';
import { sgpAdapter } from '../../integrations/sgp/sgp.adapter.ts';
import { whatsappAdapter } from '../../integrations/whatsapp/whatsapp.adapter.ts';

const router = Router();

// GET /health
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'enlace-telecom-crm',
    version: '1.2.0-modular'
  });
});

// GET /health/live (Liveness probe for orchestrators)
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

// GET /health/ready (Readiness probe: checks persistence readiness and adapters)
router.get('/ready', (_req: Request, res: Response) => {
  const dbReady = isDbConnected();
  res.json({
    status: 'ready',
    database: {
      engine: 'PostgreSQL 16.2',
      connected: dbReady,
      mode: dbReady ? 'POSTGRESQL_OFFICIAL' : 'RESILIENT_STORAGE_ACTIVE'
    },
    integrations: {
      sgp: { configurado: sgpAdapter.isConfigurado() },
      whatsapp: { configurado: whatsappAdapter.isConfigurado() }
    },
    timestamp: new Date().toISOString()
  });
});

export const healthRoutes = router;
