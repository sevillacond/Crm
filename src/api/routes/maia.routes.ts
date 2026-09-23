import { Router, Request, Response } from 'express';
import { maiaService } from '../../modules/maia/maia.service.ts';
import { maiaPolicyEngine, MaiaNivelAutonomia } from '../../modules/maia/policyEngine.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { requireRole } from '../middlewares/rbac.middleware.ts';

const router = Router();

// GET /api/maia/status
router.get('/status', authMiddleware, (req: Request, res: Response) => {
  res.json({
    nivelAutonomia: maiaPolicyEngine.getNivel(),
    versao: 'MaIA v3.8 Flash (Policy Engine Isolated)',
    status: maiaPolicyEngine.getNivel() === 0 ? 'DESATIVADA' : 'OPERACIONAL'
  });
});

// POST /api/maia/autonomia (Only ADMIN or SUPERVISOR)
router.post('/autonomia', authMiddleware, requireRole(['ADMIN', 'SUPERVISOR']), (req: Request, res: Response) => {
  const { nivel } = req.body;
  if (typeof nivel !== 'number' || nivel < 0 || nivel > 4) {
    res.status(400).json({ error: { code: 'INVALID_AUTONOMY_LEVEL', message: 'Nível deve ser entre 0 e 4' } });
    return;
  }
  maiaPolicyEngine.setNivel(nivel as MaiaNivelAutonomia);
  res.json({ nivelAutonomia: nivel, status: 'Atualizado com sucesso' });
});

// POST /api/maia/chat
router.post('/chat', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    const { prompt, dealId, contatoId } = req.body;
    if (!prompt) {
      res.status(400).json({ error: { code: 'MISSING_PROMPT', message: 'Prompt é obrigatório' } });
      return;
    }
    const actor = req.user!;
    const output = await maiaService.processPrompt({ prompt, dealId, contatoId }, actor);
    res.json(output);
  } catch (err) {
    next(err);
  }
});

export const maiaRoutes = router;
