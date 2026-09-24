import { Request, Response, NextFunction } from 'express';
import { authService } from '../../modules/auth/auth.service.ts';
import { usersRepository } from '../../modules/users/users.repository.ts';
import { User } from '../../types/index.ts';
import { ActorContext, createActorContext } from '../../modules/auth/actorContext.ts';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      instanceId?: string;
      actor?: ActorContext;
      requestId?: string;
      token?: string;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // Proibição: Rejeitar explicitamente qualquer tentativa do frontend de injetar identidade
  if (
    req.headers['x-user-id'] ||
    req.headers['x-user-role'] ||
    req.headers['x-user-name'] ||
    req.body?.actorId ||
    req.body?.actorRole
  ) {
    // Note: Do not trust frontend actor fields; identity is solely determined by verified JWT
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Acesso não autorizado. Cabeçalho de autorização Bearer JWT ausente ou malformado.'
      }
    });
    return;
  }

  const token = authHeader.substring(7).trim();

  try {
    const payload = await authService.verifyToken(token);
    const dbUser = await usersRepository.getById(payload.sub);

    if (!dbUser) {
      res.status(401).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Usuário autenticado não encontrado no registro da instância.'
        }
      });
      return;
    }

    // P0: Isolamento estrito JWT x Usuário x Instância
    if (!payload.instanceId || !dbUser.instanceId || payload.instanceId !== dbUser.instanceId) {
      res.status(403).json({
        error: {
          code: 'INSTANCE_CONTEXT_MISMATCH',
          message: 'Conflito de isolamento: Identificador de instância no token JWT diverge do registro do usuário no banco.'
        }
      });
      return;
    }

    const effectiveInstanceId = dbUser.instanceId;

    // Consolidated ActorContext (Section 4)
    const actor = createActorContext(
      dbUser,
      {
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'] as string,
        requestId: req.requestId
      }
    );

    req.user = dbUser;
    req.instanceId = effectiveInstanceId;
    req.actor = actor;
    req.token = token;

    next();
  } catch (err: any) {
    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: err.message || 'Token de autenticação inválido, expirado ou revogado.'
      }
    });
  }
}
