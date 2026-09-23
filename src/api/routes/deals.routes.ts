import { Router, Request, Response } from 'express';
import { dealsService } from '../../modules/deals/deals.service.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { requirePermission } from '../middlewares/rbac.middleware.ts';
import { validateBody } from '../middlewares/validate.middleware.ts';
import { createDealSchema, updateDealStageSchema } from '../validators/deals.validator.ts';

const router = Router();

// GET /api/deals
router.get(
  '/',
  authMiddleware,
  requirePermission('deals:read'),
  async (req: Request, res: Response, next) => {
    try {
      const deals = await dealsService.listDeals(req.actor!.instanceId);
      res.json(deals);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/deals/:id
router.get(
  '/:id',
  authMiddleware,
  requirePermission('deals:read'),
  async (req: Request, res: Response, next) => {
    try {
      const deal = await dealsService.getDealById(req.params.id, req.actor!.instanceId);
      if (!deal) {
        res.status(404).json({ error: { code: 'DEAL_NOT_FOUND', message: 'Negócio não encontrado na instância' } });
        return;
      }
      res.json(deal);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/deals/:id/history
router.get(
  '/:id/history',
  authMiddleware,
  requirePermission('deals:read'),
  async (req: Request, res: Response, next) => {
    try {
      const deal = await dealsService.getDealById(req.params.id, req.actor!.instanceId);
      if (!deal) {
        res.status(404).json({ error: { code: 'DEAL_NOT_FOUND', message: 'Negócio não encontrado na instância' } });
        return;
      }
      const history = await dealsService.getDealHistory(req.params.id, req.actor!.instanceId);
      res.json(history);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/deals
router.post(
  '/',
  authMiddleware,
  requirePermission('deals:create'),
  validateBody(createDealSchema),
  async (req: Request, res: Response, next) => {
    try {
      const deal = await dealsService.createDeal(req.body, req.actor!);
      res.status(201).json(deal);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/deals/:id/stage
router.patch(
  '/:id/stage',
  authMiddleware,
  requirePermission('deals:stage_move'),
  validateBody(updateDealStageSchema),
  async (req: Request, res: Response, next) => {
    try {
      const { etapa, motivo } = req.body;
      const updated = await dealsService.moveStage(req.params.id, etapa, req.actor!, motivo);
      res.json(updated);
    } catch (err: any) {
      if (err.message.includes('não encontrado')) {
        res.status(404).json({ error: { code: 'DEAL_NOT_FOUND', message: err.message } });
        return;
      }
      next(err);
    }
  }
);

export const dealsRoutes = router;
