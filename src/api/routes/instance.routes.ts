import { Router, Request, Response } from 'express';
import { instancesService } from '../../modules/instances/instances.service.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { requireRole } from '../middlewares/rbac.middleware.ts';

const router = Router();

// GET /api/instance
router.get('/', async (_req: Request, res: Response, next) => {
  try {
    const instance = await instancesService.getInstance();
    res.json(instance);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/instance (Only ADMIN)
router.patch('/', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response, next) => {
  try {
    const current = await instancesService.getInstance();
    const updated = await instancesService.updateInstance(current.instanceId, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export const instanceRoutes = router;
