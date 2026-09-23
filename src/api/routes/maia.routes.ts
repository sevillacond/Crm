import { Router, Request, Response } from 'express';
import { maiaService } from '../../modules/maia/maia.service.ts';
import { maiaPolicyEngine, MaiaNivelAutonomia } from '../../modules/maia/policyEngine.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { requirePermission } from '../middlewares/rbac.middleware.ts';

const router = Router();

// GET /api/maia/status
router.get(
  '/status',
  authMiddleware,
  requirePermission('maia:use'),
  (req: Request, res: Response) => {
    const nivel = maiaPolicyEngine.getNivel(req.actor!.instanceId);
    res.json({
      nivelAutonomia: nivel,
      versao: 'MaIA v2.4 (Policy Engine & Cryptographic Audit Isolated)',
      status: nivel === 0 ? 'DESATIVADA' : 'OPERACIONAL',
      instanceId: req.actor!.instanceId
    });
  }
);

// POST /api/maia/autonomia (Requires maia:configure permission)
router.post(
  '/autonomia',
  authMiddleware,
  requirePermission('maia:configure'),
  async (req: Request, res: Response) => {
    const { nivel } = req.body;
    if (typeof nivel !== 'number' || nivel < 0 || nivel > 4) {
      res.status(400).json({ error: { code: 'INVALID_AUTONOMY_LEVEL', message: 'Nível deve ser entre 0 e 4' } });
      return;
    }
    await maiaPolicyEngine.setNivel(nivel as MaiaNivelAutonomia, req.actor!.instanceId);
    res.json({ nivelAutonomia: nivel, instanceId: req.actor!.instanceId, status: 'Atualizado e persistido com sucesso' });
  }
);

// POST /api/maia/chat
router.post(
  '/chat',
  authMiddleware,
  requirePermission('maia:use'),
  async (req: Request, res: Response, next) => {
    try {
      const { prompt, dealId, contatoId } = req.body;
      if (!prompt) {
        res.status(400).json({ error: { code: 'MISSING_PROMPT', message: 'Prompt é obrigatório' } });
        return;
      }
      const output = await maiaService.processPrompt({ prompt, dealId, contatoId }, req.actor!);
      res.json(output);
    } catch (err) {
      next(err);
    }
  }
);

export const maiaRoutes = router;
