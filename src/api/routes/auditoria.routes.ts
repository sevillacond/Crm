import { Router, Request, Response } from 'express';
import { auditoriaService } from '../../modules/auditoria/auditoria.service.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { requireRole } from '../middlewares/rbac.middleware.ts';

const router = Router();

// GET /api/audit (Only ADMIN and SUPERVISOR)
router.get(
  '/',
  authMiddleware,
  requireRole(['ADMIN', 'SUPERVISOR']),
  async (req: Request, res: Response, next) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const logs = await auditoriaService.listLogs(limit);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  }
);

export const auditoriaRoutes = router;
