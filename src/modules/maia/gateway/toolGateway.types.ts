import { ActorContext } from '../../auth/actorContext.ts';
import { ToolRiskLevel } from '../policyEngine.ts';
import { z } from 'zod';

export type ToolCategory = 'CRM' | 'SGP' | 'TELEFONIA' | 'WHATSAPP' | 'FINANCEIRO' | 'SISTEMA';

export type ToolExecutionStatus =
  | 'EXECUTED'
  | 'PENDING_APPROVAL'
  | 'BLOCKED'
  | 'MOCK'
  | 'STUB'
  | 'PARTIAL'
  | 'ERROR';

export type ToolOperationMode = 'REAL' | 'MOCK' | 'STUB' | 'PARTIAL';

export interface ToolDefinition<TParams = any, TResult = any> {
  name: string;
  description: string;
  category: ToolCategory;
  nivelMinimoAutonomia: number;
  requerAprovacaoHumana: boolean;
  riskLevel: ToolRiskLevel;
  parametersSchema?: z.ZodType<TParams>;
  mode: ToolOperationMode;
  execute: (params: TParams, actor: ActorContext, context?: any) => Promise<TResult>;
}

export interface ToolGatewayResult {
  toolName: string;
  status: ToolExecutionStatus;
  mode: ToolOperationMode;
  approvalId?: string;
  data?: any;
  message?: string;
  error?: string;
  latencyMs: number;
}

export interface ExecuteGatewayToolOptions {
  toolName: string;
  params: any;
  actor: ActorContext;
  context?: any;
  timeoutMs?: number;
}
