import { Router, Request, Response } from 'express';
import { dealsService } from '../../modules/deals/deals.service.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { requireRole } from '../middlewares/rbac.middleware.ts';
import { validateBody } from '../middlewares/validate.middleware.ts';
import { createDealSchema, updateDealStageSchema } from '../validators/deals.validator.ts';

const router = Router();

// GET /api/deals
router.get('/', authMiddleware, async (_req: Request, res: Response, next) => {
  try {
    const deals = await dealsService.listDeals();
    res.json(deals);
  } catch (err) {
    next(err);
  }
});

// GET /api/deals/:id
router.get('/:id', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    const deal = await dealsService.getDealById(req.params.id);
    if (!deal) {
      res.status(404).json({ error: { code: 'DEAL_NOT_FOUND', message: 'Negócio não encontrado' } });
      return;
    }
    res.json(deal);
  } catch (err) {
    next(err);
  }
});

// GET /api/deals/:id/history
router.get('/:id/history', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    const history = await dealsService.getDealHistory(req.params.id);
    res.json(history);
  } catch (err) {
    next(err);
  }
});

// POST /api/deals
router.post(
  '/',
  authMiddleware,
  requireRole(['ADMIN', 'SUPERVISOR', 'ATENDENTE']),
  validateBody(createDealSchema),
  async (req: Request, res: Response, next) => {
    try {
      const actor = req.user!;
      const deal = await dealsService.createDeal(req.body, actor);
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
  requireRole(['ADMIN', 'SUPERVISOR', 'ATENDENTE']),
  validateBody(updateDealStageSchema),
  async (req: Request, res: Response, next) => {
    try {
      const actor = req.user!;
      const { etapa, motivo } = req.body;
      const updated = await dealsService.moveStage(req.params.id, etapa, actor, motivo);
      res.json(updated);
    } catch (err: any) {
      if (err.message === 'Negócio não encontrado') {
        res.status(404).json({ error: { code: 'DEAL_NOT_FOUND', message: err.message } });
        return;
      }
      next(err);
    }
  }
);

export const dealsRoutes = router;
