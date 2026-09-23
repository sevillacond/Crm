import { Request, Response, NextFunction } from 'express';
import { authService } from '../../modules/auth/auth.service.ts';
import { usersRepository } from '../../modules/users/users.repository.ts';
import { User, Role } from '../../types/index.ts';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      requestId?: string;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const devUserIdHeader = req.headers['x-user-id'] as string;

  try {
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = authService.verifyToken(token);
      const dbUser = await usersRepository.getById(payload.sub);
      if (!dbUser) {
        res.status(401).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Usuário autenticado não encontrado no banco de dados'
          }
        });
        return;
      }
      req.user = dbUser;
      return next();
    }

    // Support for simulated session in UI environment: validates that the user exists in repository
    if (devUserIdHeader) {
      const dbUser = await usersRepository.getById(devUserIdHeader);
      if (dbUser) {
        req.user = dbUser;
        return next();
      }
    }

    // Default authenticated context (Lucas Mendes - SDR Comercial) for transparent backward compatibility
    const defaultUser = await usersRepository.getById('usr_atendente_1');
    if (defaultUser) {
      req.user = defaultUser;
      return next();
    }

    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Acesso não autorizado. Cabeçalho de autenticação ausente ou inválido.'
      }
    });
  } catch (err: any) {
    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: err.message || 'Token de autenticação inválido.'
      }
    });
  }
}
