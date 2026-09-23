import { Router, Request, Response } from 'express';
import { planosService } from '../../modules/planos/planos.service.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { requirePermission } from '../middlewares/rbac.middleware.ts';

const router = Router();

// GET /api/planos
router.get(
  '/',
  authMiddleware,
  requirePermission('planos:read'),
  async (req: Request, res: Response, next) => {
    try {
      const planos = await planosService.getAll(req.instanceId);
      res.json(planos);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/planos/:id
router.get(
  '/:id',
  authMiddleware,
  requirePermission('planos:read'),
  async (req: Request, res: Response, next) => {
    try {
      const plano = await planosService.getById(req.params.id, req.instanceId);
      if (!plano) {
        res.status(404).json({ error: { code: 'PLANO_NOT_FOUND', message: 'Plano não encontrado' } });
        return;
      }
      res.json(plano);
    } catch (err) {
      next(err);
    }
  }
);

export const planosRoutes = router;
