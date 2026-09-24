import { Router, Request, Response } from 'express';
import { authService } from '../../modules/auth/auth.service.ts';
import { validateBody } from '../middlewares/validate.middleware.ts';
import { loginSchema } from '../validators/auth.validator.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';

const router = Router();

// POST /api/auth/login
router.post('/login', validateBody(loginSchema), async (req: Request, res: Response, next) => {
  try {
    const { email, password } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const session = await authService.login(email, password, ip, userAgent);
    res.json(session);
  } catch (err: any) {
    if (err.message === 'AUTH_SECURITY_UNAVAILABLE') {
      res.status(503).json({
        error: {
          code: 'AUTH_SECURITY_UNAVAILABLE',
          message: 'Serviço de autenticação temporariamente indisponível por política de segurança.'
        }
      });
      return;
    }
    res.status(401).json({
      error: {
        code: 'AUTH_FAILED',
        message: err.message || 'Falha na autenticação'
      }
    });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    if (req.token) {
      await authService.logout(req.token, req.user, ip, userAgent);
    }
    res.json({ status: 'ok', message: 'Sessão encerrada e token revogado com sucesso.' });
  } catch (err) {
    next(err);
  }
});

export const authRoutes = router;
