import { Router, Request, Response } from 'express';
import { isDbConnected } from '../../db/client.ts';
import { isRedisConnected } from '../../shared/redis.ts';
import { env } from '../../config/env.ts';
import { sgpAdapter } from '../../integrations/sgp/sgp.adapter.ts';
import { whatsappAdapter } from '../../integrations/whatsapp/whatsapp.adapter.ts';
import { asteriskAdapter } from '../../integrations/asterisk/asterisk.adapter.ts';
import { paymentsAdapter } from '../../integrations/payments/payments.adapter.ts';

const router = Router();

// Liveness handler: verifica se o processo Node/Bun está respondendo
const livenessHandler = (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
};

// Readiness handler: verifica se o CORE operacional (PostgreSQL e Redis) está pronto
const readinessHandler = (_req: Request, res: Response) => {
  const dbReady = isDbConnected();
  const redisReady = isRedisConnected();
  const isProduction = env.NODE_ENV === 'production';

  // Em produção, PostgreSQL é estritamente obrigatório
  if (isProduction && !dbReady) {
    res.status(503).json({
      status: 'not_ready',
      ready: false,
      reason: 'PostgreSQL 16 indisponível. Conexão obrigatória em produção.',
      core: {
        database: 'DOWN',
        redis: redisReady ? 'UP' : 'DOWN'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.status(200).json({
    status: 'ready',
    ready: true,
    environment: env.NODE_ENV,
    core: {
      database: dbReady ? 'UP' : (isProduction ? 'DOWN' : 'DEVELOPMENT_DEMO_STORAGE'),
      redis: redisReady ? 'UP' : 'LOCAL_IN_MEMORY'
    },
    integrations: {
      whatsapp: whatsappAdapter.status,
      asterisk: asteriskAdapter.status,
      sgp: sgpAdapter.status,
      payments: paymentsAdapter.status
    },
    timestamp: new Date().toISOString()
  });
};

// Integrations health handler (FASE 18): Detalhamento individual de cada integração
const integrationsHandler = (_req: Request, res: Response) => {
  const dbReady = isDbConnected();
  const redisReady = isRedisConnected();
  const geminiConfigured = !!(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('CHANGE_ME'));

  res.status(200).json({
    postgresql: dbReady ? 'CONNECTED' : (env.NODE_ENV === 'production' ? 'ERROR' : 'DEVELOPMENT_SIMULATED'),
    redis: redisReady ? 'CONNECTED' : (env.NODE_ENV === 'production' ? 'ERROR' : 'LOCAL_IN_MEMORY'),
    whatsapp: whatsappAdapter.status,
    sgp: sgpAdapter.status,
    asterisk: asteriskAdapter.status,
    payments: paymentsAdapter.status,
    gemini: geminiConfigured ? 'CONNECTED' : 'NOT_CONFIGURED',
    timestamp: new Date().toISOString()
  });
};

// Liveness routes
router.get('/live', livenessHandler);
router.get('/liveness', livenessHandler);

// Readiness routes
router.get('/ready', readinessHandler);
router.get('/readiness', readinessHandler);

// Integrations breakdown
router.get('/integrations', integrationsHandler);

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
