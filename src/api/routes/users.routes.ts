import { Router, Request, Response } from 'express';
import { usersService } from '../../modules/users/users.service.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { requirePermission } from '../middlewares/rbac.middleware.ts';

const router = Router();

// GET /api/users
router.get(
  '/',
  authMiddleware,
  requirePermission('usuarios:read'),
  async (req: Request, res: Response, next) => {
    try {
      const users = await usersService.getAll(req.actor!.instanceId);
      res.json(users);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/users (Requires usuarios:create permission)
router.post(
  '/',
  authMiddleware,
  requirePermission('usuarios:create'),
  async (req: Request, res: Response, next) => {
    try {
      const { name, email, role, department, password } = req.body;
      if (!name || !email || !role) {
        res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Nome, e-mail e cargo são obrigatórios.' } });
        return;
      }
      const newUser = await usersService.createUser(
        {
          id: `usr_${Date.now()}`,
          instanceId: req.actor!.instanceId,
          name,
          email,
          role,
          department: department || 'Geral',
          avatar: '',
          status: 'OFFLINE'
        },
        password,
        req.actor!.instanceId
      );
      res.status(201).json(newUser);
    } catch (err) {
      next(err);
    }
  }
);

export const usersRoutes = router;
