import { Role } from '../../types/index.ts';

export type Permission =
  | 'contatos:read'
  | 'contatos:create'
  | 'contatos:update'
  | 'contatos:delete'
  | 'deals:read'
  | 'deals:create'
  | 'deals:update'
  | 'deals:delete'
  | 'deals:stage_move'
  | 'ordens:read'
  | 'ordens:update'
  | 'planos:read'
  | 'auditoria:read'
  | 'usuarios:read'
  | 'usuarios:create'
  | 'usuarios:update'
  | 'usuarios:delete'
  | 'instancia:read'
  | 'instancia:update'
  | 'viabilidade:consultar'
  | 'maia:use'
  | 'maia:execute'
  | 'maia:configure';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    'contatos:read',
    'contatos:create',
    'contatos:update',
    'contatos:delete',
    'deals:read',
    'deals:create',
    'deals:update',
    'deals:delete',
    'deals:stage_move',
    'ordens:read',
    'ordens:update',
    'planos:read',
    'auditoria:read',
    'usuarios:read',
    'usuarios:create',
    'usuarios:update',
    'usuarios:delete',
    'instancia:read',
    'instancia:update',
    'viabilidade:consultar',
    'maia:use',
    'maia:execute',
    'maia:configure'
  ],
  SUPERVISOR: [
    'contatos:read',
    'contatos:create',
    'contatos:update',
    'contatos:delete',
    'deals:read',
    'deals:create',
    'deals:update',
    'deals:delete',
    'deals:stage_move',
    'ordens:read',
    'ordens:update',
    'planos:read',
    'auditoria:read',
    'usuarios:read',
    'instancia:read',
    'viabilidade:consultar',
    'maia:use',
    'maia:execute',
    'maia:configure'
  ],
  ATENDENTE: [
    'contatos:read',
    'contatos:create',
    'contatos:update',
    'deals:read',
    'deals:create',
    'deals:update',
    'deals:stage_move',
    'planos:read',
    'viabilidade:consultar',
    'maia:use',
    'maia:execute'
  ],
  TECNICO: [
    'ordens:read',
    'ordens:update',
    'contatos:read',
    'planos:read',
    'viabilidade:consultar'
  ],
  MAIA_AGENT: [
    'contatos:read',
    'deals:read',
    'planos:read',
    'viabilidade:consultar',
    'maia:use',
    'maia:execute'
  ]
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}
