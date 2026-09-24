import { Router, Request, Response } from 'express';
import { ordensService } from '../../modules/ordens/ordens.service.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { requirePermission } from '../middlewares/rbac.middleware.ts';

const router = Router();

// GET /api/ordens-servico
router.get(
  '/',
  authMiddleware,
  requirePermission('ordens:read'),
  async (req: Request, res: Response, next) => {
    try {
      const ordens = await ordensService.listAll(req.instanceId!);
      res.json(ordens);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/ordens-servico/:id/status
router.patch(
  '/:id/status',
  authMiddleware,
  requirePermission('ordens:update'),
  async (req: Request, res: Response, next) => {
    try {
      const { status } = req.body;
      if (!status) {
        res.status(400).json({ error: { code: 'MISSING_STATUS', message: 'Status é obrigatório' } });
        return;
      }
      const actor = req.user!;
      const updated = await ordensService.updateStatus(req.params.id, status, actor);
      if (!updated) {
        res.status(404).json({ error: { code: 'OS_NOT_FOUND', message: 'Ordem de serviço não encontrada' } });
        return;
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

export const ordensRoutes = router;
