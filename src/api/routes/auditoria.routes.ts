import { Router, Request, Response } from 'express';
import { auditoriaService } from '../../modules/auditoria/auditoria.service.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { requirePermission } from '../middlewares/rbac.middleware.ts';

const router = Router();

// GET /api/audit (Requires auditoria:read permission)
router.get(
  '/',
  authMiddleware,
  requirePermission('auditoria:read'),
  async (req: Request, res: Response, next) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const logs = await auditoriaService.listLogs(req.actor!.instanceId, limit);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  }
);

export const auditoriaRoutes = router;
