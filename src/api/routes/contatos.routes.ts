import { Router, Request, Response } from 'express';
import { contatosService } from '../../modules/contatos/contatos.service.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { requirePermission } from '../middlewares/rbac.middleware.ts';
import { validateBody } from '../middlewares/validate.middleware.ts';
import { createContatoSchema, updateContatoSchema } from '../validators/contatos.validator.ts';

const router = Router();

// GET /api/contatos
router.get(
  '/',
  authMiddleware,
  requirePermission('contatos:read'),
  async (req: Request, res: Response, next) => {
    try {
      const query = req.query.q as string;
      const status = req.query.status as string;
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const offset = req.query.offset ? Number(req.query.offset) : 0;

      const result = await contatosService.listContatos({
        instanceId: req.actor!.instanceId,
        query,
        status,
        limit,
        offset
      });
      res.json(result.data);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/contatos/:id
router.get(
  '/:id',
  authMiddleware,
  requirePermission('contatos:read'),
  async (req: Request, res: Response, next) => {
    try {
      const contato = await contatosService.getContatoById(req.params.id, req.actor!.instanceId);
      if (!contato) {
        res.status(404).json({ error: { code: 'CONTACT_NOT_FOUND', message: 'Contato não encontrado na instância' } });
        return;
      }
      res.json(contato);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/contatos
router.post(
  '/',
  authMiddleware,
  requirePermission('contatos:create'),
  validateBody(createContatoSchema),
  async (req: Request, res: Response, next) => {
    try {
      const novoContato = await contatosService.createContato(req.body, req.actor!);
      res.status(201).json(novoContato);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/contatos/:id
router.patch(
  '/:id',
  authMiddleware,
  requirePermission('contatos:update'),
  validateBody(updateContatoSchema),
  async (req: Request, res: Response, next) => {
    try {
      const updated = await contatosService.updateContato(req.params.id, req.body, req.actor!);
      if (!updated) {
        res.status(404).json({ error: { code: 'CONTACT_NOT_FOUND', message: 'Contato não encontrado na instância' } });
        return;
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/contatos/:id
router.delete(
  '/:id',
  authMiddleware,
  requirePermission('contatos:delete'),
  async (req: Request, res: Response, next) => {
    try {
      const success = await contatosService.deleteContato(req.params.id, req.actor!);
      if (!success) {
        res.status(404).json({ error: { code: 'CONTACT_NOT_FOUND', message: 'Contato não encontrado na instância' } });
        return;
      }
      res.json({ status: 'ok', message: 'Contato excluído com sucesso.' });
    } catch (err) {
      next(err);
    }
  }
);

export const contatosRoutes = router;
