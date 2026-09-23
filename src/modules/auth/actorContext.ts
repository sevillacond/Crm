import { Role, User } from '../../types/index.ts';
import { Permission, ROLE_PERMISSIONS } from './permissions.ts';

export interface ActorContext {
  userId: string;
  instanceId: string;
  role: Role;
  permissions: Permission[];
  name: string;
  email: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  isMaia?: boolean;
}

export function createActorContext(
  user: User,
  options?: {
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    isMaia?: boolean;
  }
): ActorContext {
  if (!user.instanceId) {
    throw new Error(`Usuário ${user.id} (${user.email}) não possui instanceId associado para criação do ActorContext.`);
  }

  return {
    userId: user.id,
    instanceId: user.instanceId,
    role: user.role,
    permissions: ROLE_PERMISSIONS[user.role] || [],
    name: user.name,
    email: user.email,
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
    requestId: options?.requestId,
    isMaia: options?.isMaia || false
  };
}
