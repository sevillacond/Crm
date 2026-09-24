import { Router, Request, Response } from 'express';
import { maiaService } from '../../modules/maia/maia.service.ts';
import { maiaPolicyEngine, MaiaNivelAutonomia } from '../../modules/maia/policyEngine.ts';
import { maiaApprovalsRepository } from '../../modules/maia/approvals.repository.ts';
import {
  approveToolApproval,
  rejectToolApproval,
  executeApprovedTool,
  approveAndExecuteTool
} from '../../modules/maia/toolRegistry.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { requirePermission } from '../middlewares/rbac.middleware.ts';
import { maiaRateLimiter } from '../middlewares/rateLimiter.ts';

const router = Router();

// Apply Maia specific rate limiter across all Maia endpoints
router.use(maiaRateLimiter);

// GET /api/maia/status
router.get(
  '/status',
  authMiddleware,
  requirePermission('maia:use'),
  async (req: Request, res: Response) => {
    try {
      const nivel = await maiaPolicyEngine.loadNivelForInstance(req.actor!.instanceId);
      res.json({
        nivelAutonomia: nivel,
        versao: 'MaIA v2.4 (Policy Engine & Fail-Closed Governance)',
        status: nivel === 0 ? 'DESATIVADA' : 'OPERACIONAL',
        instanceId: req.actor!.instanceId
      });
    } catch (err: any) {
      if (err.message.includes('MAIA_POLICY_UNAVAILABLE')) {
        res.status(503).json({
          error: {
            code: 'MAIA_POLICY_UNAVAILABLE',
            message: 'A política de governança da MaIA não está disponível no momento.'
          }
        });
        return;
      }
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
    }
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
    try {
      await maiaPolicyEngine.setNivel(nivel as MaiaNivelAutonomia, req.actor!.instanceId);
      res.json({ nivelAutonomia: nivel, instanceId: req.actor!.instanceId, status: 'Atualizado e persistido com sucesso' });
    } catch (err: any) {
      if (err.message.includes('MAIA_POLICY_UNAVAILABLE')) {
        res.status(503).json({
          error: {
            code: 'MAIA_POLICY_UNAVAILABLE',
            message: 'A política de governança da MaIA não está disponível no momento.'
          }
        });
        return;
      }
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
    }
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
    } catch (err: any) {
      if (err.message && err.message.includes('MAIA_POLICY_UNAVAILABLE')) {
        res.status(503).json({
          error: {
            code: 'MAIA_POLICY_UNAVAILABLE',
            message: 'A política de governança da MaIA não está disponível no momento.'
          }
        });
        return;
      }
      next(err);
    }
  }
);

// GET /api/maia/approvals (List pending human approvals for the instance)
router.get(
  '/approvals',
  authMiddleware,
  requirePermission('maia:use'),
  async (req: Request, res: Response, next) => {
    try {
      const pending = await maiaApprovalsRepository.listPending(req.actor!.instanceId);
      res.json({ approvals: pending });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/maia/approvals/:id/approve (Requires maia:configure or supervisor/admin role)
router.post(
  '/approvals/:id/approve',
  authMiddleware,
  requirePermission('maia:configure'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const autoExecute = req.query.execute === 'true';

      if (autoExecute) {
        const result = await approveAndExecuteTool(id, req.actor!);
        res.json(result);
      } else {
        const approved = await approveToolApproval(id, req.actor!);
        res.json({ status: 'APPROVED', request: approved });
      }
    } catch (err: any) {
      res.status(400).json({ error: { code: 'APPROVAL_FAILED', message: err.message } });
    }
  }
);

// POST /api/maia/approvals/:id/execute (Executes an approved tool)
router.post(
  '/approvals/:id/execute',
  authMiddleware,
  requirePermission('maia:configure'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await executeApprovedTool(id, req.actor!);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: { code: 'EXECUTION_FAILED', message: err.message } });
    }
  }
);

// POST /api/maia/approvals/:id/reject
router.post(
  '/approvals/:id/reject',
  authMiddleware,
  requirePermission('maia:configure'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const rejected = await rejectToolApproval(id, req.actor!, reason || 'Rejeitado pelo supervisor');
      res.json({ status: 'REJECTED', request: rejected });
    } catch (err: any) {
      res.status(400).json({ error: { code: 'REJECTION_FAILED', message: err.message } });
    }
  }
);

export const maiaRoutes = router;
