import { Request, Response, NextFunction } from 'express';
import { Role } from '../../types/index.ts';
import { Permission, hasPermission } from '../../modules/auth/permissions.ts';

export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Autenticação necessária para acessar este recurso.'
        }
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN_INSUFFICIENT_ROLE',
          message: `Acesso negado. Perfil '${req.user.role}' não possui permissão para esta operação. Perfis permitidos: ${allowedRoles.join(', ')}.`
        }
      });
      return;
    }

    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Autenticação necessária para acessar este recurso.'
        }
      });
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN_INSUFFICIENT_PERMISSION',
          message: `Acesso negado. Perfil '${req.user.role}' não possui a permissão '${permission}' necessária para esta operação.`
        }
      });
      return;
    }

    next();
  };
}
