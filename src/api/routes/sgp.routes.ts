import { Router, Request, Response } from 'express';
import { sgpService } from '../../modules/sgp/sgp.service.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';

const router = Router();

// Listar todos os contratos SGP da instância
router.get('/contratos', authMiddleware, async (req: Request, res: Response) => {
  try {
    const actor = req.actor!;
    const contratos = await sgpService.getContracts(actor.instanceId);
    return res.json({ contratos });
  } catch (err: any) {
    return res.status(400).json({ error: { message: err.message } });
  }
});

// Buscar contrato por ID
router.get('/contratos/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const actor = req.actor!;
    const contrato = await sgpService.getContractById(req.params.id, actor.instanceId);
    if (!contrato) {
      return res.status(404).json({ error: { message: 'Contrato não encontrado' } });
    }
    return res.json({ contrato });
  } catch (err: any) {
    return res.status(400).json({ error: { message: err.message } });
  }
});

// Diagnóstico de ONT / Conexão (Ping & Sinal óptico)
router.get('/contratos/:id/diagnostico', authMiddleware, async (req: Request, res: Response) => {
  try {
    const actor = req.actor!;
    const diag = await sgpService.pingOnt(req.params.id, actor.instanceId);
    return res.json({ diagnostico: diag });
  } catch (err: any) {
    return res.status(400).json({ error: { message: err.message } });
  }
});

// Desbloqueio em Confiança
router.post('/contratos/:id/desbloqueio-confianca', authMiddleware, async (req: Request, res: Response) => {
  try {
    const actor = req.actor!;
    const resultado = await sgpService.desbloqueioConfianca(req.params.id, actor);
    return res.json({ resultado });
  } catch (err: any) {
    return res.status(400).json({ error: { message: err.message } });
  }
});

export const sgpRoutes = router;
