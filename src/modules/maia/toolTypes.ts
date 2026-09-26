import { ActorContext } from '../auth/actorContext.ts';

export interface MaiaToolDefinition {
  name: string;
  description: string;
  nivelMinimoAutonomia: number;
  requerAprovacaoHumana: boolean;
  riskLevel?: string;
  requiresSeparationOfDuties?: boolean;
  execute: (params: any, actor: ActorContext) => Promise<any>;
  /** @deprecated INTERNAL_ONLY / TEST_ONLY - Proibido acesso direto em rotas HTTP */
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
