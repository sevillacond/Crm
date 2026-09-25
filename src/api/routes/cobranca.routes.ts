import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { requirePermission } from '../middlewares/rbac.middleware.ts';
import { paymentsAdapter } from '../../integrations/payments/payments.adapter.ts';

const router = Router();

// GET /api/cobranca (Requires cobranca:read permission)
router.get(
  '/',
  authMiddleware,
  requirePermission('cobranca:read'),
  async (req: Request, res: Response) => {
    // Isolamento estrito por instanceId
    const instanceId = req.actor!.instanceId;
    res.json({
      instanceId,
      gatewayConfigurado: paymentsAdapter.isConfigurado(),
      faturas: []
    });
  }
);

// POST /api/cobranca/pix (Requires cobranca:read permission)
router.post(
  '/pix',
  authMiddleware,
  requirePermission('cobranca:read'),
  async (req: Request, res: Response, next) => {
    try {
      const { valor, dealId } = req.body;
      if (!valor || typeof valor !== 'number' || valor <= 0) {
        res.status(400).json({ error: { code: 'INVALID_AMOUNT', message: 'Valor deve ser um número positivo.' } });
        return;
      }
      const cobranca = await paymentsAdapter.gerarPixCobranca({
        valor,
        cpfCnpj: '000.000.000-00',
        nomeCliente: 'Cliente',
        descricao: dealId ? `Cobrança Deal ${dealId}` : 'Cobrança Avulsa',
        faturaId: `fat_${Date.now()}`
      });
      res.json(cobranca);
    } catch (err) {
      next(err);
    }
  }
);

export const cobrancaRoutes = router;
