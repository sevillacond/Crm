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
      const instanceId = req.instanceId || (await instancesService.getInstance()).instanceId;
      const updated = await instancesService.updateInstance(instanceId, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

export const instanceRoutes = router;
