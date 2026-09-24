import { ActorContext } from '../auth/actorContext.ts';

export interface MaiaToolDefinition {
  name: string;
  description: string;
  nivelMinimoAutonomia: number;
  requerAprovacaoHumana: boolean;
  execute: (params: any, actor: ActorContext) => Promise<any>;
  _rawExecute?: (params: any, actor: ActorContext) => Promise<any>;
}

export interface MaiaToolExecutionResult {
  status: 'EXECUTED' | 'PENDING_APPROVAL' | 'BLOCKED';
  toolName: string;
  approvalId?: string;
  data?: any;
  message?: string;
}

export interface ExecuteToolOptions {
  toolName: string;
  params: any;
  actor: ActorContext;
}
