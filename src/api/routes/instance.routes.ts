import { Router, Request, Response } from 'express';
import { instancesService } from '../../modules/instances/instances.service.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { requirePermission } from '../middlewares/rbac.middleware.ts';

const router = Router();

// GET /api/instance
router.get(
  '/',
  authMiddleware,
  requirePermission('instancia:read'),
  async (req: Request, res: Response, next) => {
    try {
      const instance = await instancesService.getInstance(req.instanceId);
      res.json(instance);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/instance (Requires instancia:update permission)
router.patch(
  '/',
  authMiddleware,
  requirePermission('instancia:update'),
  async (req: Request, res: Response, next) => {
    try {
      if (!req.instanceId) {
        res.status(401).json({ error: { code: 'MISSING_INSTANCE_CONTEXT', message: 'Contexto de instância ausente.' } });
        return;
      }
      const updated = await instancesService.updateInstance(req.instanceId, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

export const instanceRoutes = router;
