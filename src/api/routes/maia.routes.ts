import { Router, Request, Response } from 'express';
import { maiaService } from '../../modules/maia/maia.service.ts';
import { maiaPolicyEngine, MaiaNivelAutonomia } from '../../modules/maia/policyEngine.ts';
import { maiaApprovalsRepository } from '../../modules/maia/approvals.repository.ts';
import { toolGateway } from '../../modules/maia/gateway/toolGateway.ts';
import { aiRouter } from '../../modules/maia/router/aiRouter.ts';
import { maiaMemoryRepository } from '../../modules/maia/memory/memory.repository.ts';
import {
  approveToolApproval,
  rejectToolApproval,
  executeApprovedTool
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
      const routerStatus = await aiRouter.getStatus();

      res.json({
        nivelAutonomia: nivel,
        versao: 'MaIA Runtime v3.0 (Enlace Transversal Agent Runtime)',
        status: nivel === 0 ? 'DESATIVADA' : 'OPERACIONAL',
        instanceId: req.actor!.instanceId,
        aiRouter: routerStatus
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

// GET /api/maia/tools (List tools available in Tool Gateway)
router.get(
  '/tools',
  authMiddleware,
  requirePermission('maia:use'),
  async (_req: Request, res: Response) => {
    try {
      const tools = toolGateway.getToolsList();
      res.json({ tools });
    } catch (err: any) {
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
      const { prompt, dealId, contatoId, conversationId, context } = req.body;
      if (!prompt) {
        res.status(400).json({ error: { code: 'MISSING_PROMPT', message: 'Prompt é obrigatório' } });
        return;
      }
      const output = await maiaService.processPrompt(
        { prompt, dealId, contatoId, conversationId, context },
        req.actor!
      );
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

// GET /api/maia/conversations
router.get(
  '/conversations',
  authMiddleware,
  requirePermission('maia:use'),
  async (req: Request, res: Response, next) => {
    try {
      const conversations = await maiaMemoryRepository.listConversations(
        req.actor!.instanceId,
        req.actor!.userId
      );
      res.json({ conversations });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/maia/conversations
router.post(
  '/conversations',
  authMiddleware,
  requirePermission('maia:use'),
  async (req: Request, res: Response, next) => {
    try {
      const { title, dealId, contatoId, metadata } = req.body;
      const conv = await maiaMemoryRepository.createConversation({
        instanceId: req.actor!.instanceId,
        userId: req.actor!.userId,
        title,
        dealId,
        contatoId,
        metadata
      });
      res.status(201).json(conv);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/maia/conversations/:id/messages
router.get(
  '/conversations/:id/messages',
  authMiddleware,
  requirePermission('maia:use'),
  async (req: Request, res: Response, next) => {
    try {
      const { id } = req.params;
      const messages = await maiaMemoryRepository.getMessages(id, req.actor!.instanceId);
      res.json({ messages });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/maia/approvals (List active human approvals for the instance)
router.get(
  '/approvals',
  authMiddleware,
  requirePermission('maia:use'),
  async (req: Request, res: Response, next) => {
    try {
      const statusQuery = req.query.status as string;
      let list;
      if (statusQuery === 'PENDING_APPROVAL') {
        list = await maiaApprovalsRepository.listPending(req.actor!.instanceId);
      } else {
        list = await maiaApprovalsRepository.listActive(req.actor!.instanceId);
      }
      res.json({ approvals: list });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/maia/approvals/:id/approve (Requires maia:configure or supervisor/admin role)
// P0: Aprovação e Execução são estritamente separadas. Auto-execute (execute=true) eliminado.
router.post(
  '/approvals/:id/approve',
  authMiddleware,
  requirePermission('maia:configure'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const approved = await approveToolApproval(id, req.actor!);
      res.json({ status: 'APPROVED', request: approved });
    } catch (err: any) {
      const isSelfApproval = err.message.includes('SELF_APPROVAL_PROHIBITED') || err.message.includes('SEPARATION_OF_DUTIES_VIOLATION');
      res.status(isSelfApproval ? 403 : 400).json({
        error: {
          code: isSelfApproval ? 'SELF_APPROVAL_PROHIBITED' : 'APPROVAL_FAILED',
          message: err.message
        }
      });
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
      const isSoD = err.message.includes('SEPARATION_OF_DUTIES_VIOLATION');
      const isPolicyFail = err.message.includes('POLICY_REVALIDATION_FAILED');
      const isTampered = err.message.includes('PARAMS_HASH_MISMATCH');
      res.status(isSoD ? 403 : (isPolicyFail || isTampered ? 422 : 400)).json({
        error: {
          code: isSoD ? 'SEPARATION_OF_DUTIES_VIOLATION' : (isPolicyFail ? 'POLICY_REVALIDATION_FAILED' : (isTampered ? 'PARAMS_HASH_MISMATCH' : 'EXECUTION_FAILED')),
          message: err.message
        }
      });
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
