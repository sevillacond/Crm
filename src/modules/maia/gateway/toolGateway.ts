import { ActorContext } from '../../auth/actorContext.ts';
import { maiaPolicyEngine } from '../policyEngine.ts';
import { maiaApprovalsRepository } from '../approvals.repository.ts';
import { auditoriaService } from '../../auditoria/auditoria.service.ts';
import {
  ToolDefinition,
  ToolGatewayResult,
  ExecuteGatewayToolOptions,
  ToolCategory
} from './toolGateway.types.ts';

export class ToolGateway {
  private registry = new Map<string, ToolDefinition>();

  registerTool<TParams, TResult>(tool: ToolDefinition<TParams, TResult>): void {
    this.registry.set(tool.name, tool);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.registry.get(name);
  }

  getToolsList(): Array<{
    name: string;
    description: string;
    category: ToolCategory;
    nivelMinimoAutonomia: number;
    requerAprovacaoHumana: boolean;
    riskLevel: string;
    mode: string;
  }> {
    return Array.from(this.registry.values()).map(t => ({
      name: t.name,
      description: t.description,
      category: t.category,
      nivelMinimoAutonomia: t.nivelMinimoAutonomia,
      requerAprovacaoHumana: t.requerAprovacaoHumana,
      riskLevel: t.riskLevel,
      mode: t.mode
    }));
  }

  /**
   * P0: Execução segura e governada via Tool Gateway.
   * Não executa sem ActorContext, sem validação de esquema e sem passar pelo Policy Engine.
   */
  async executeTool(options: ExecuteGatewayToolOptions): Promise<ToolGatewayResult> {
    const { toolName, params, actor, timeoutMs = 10000 } = options;
    const startTime = Date.now();

    // 1. Validar autorização e isolamento de instância
    if (!actor || !actor.instanceId) {
      throw new Error('Acesso negado: Contexto de autorização ou instanceId ausente no Tool Gateway.');
    }

    // 2. Localizar ferramenta no catálogo do gateway
    const toolDef = this.registry.get(toolName);
    if (!toolDef) {
      throw new Error(`Ferramenta '${toolName}' não registrada no Tool Gateway da MaIA.`);
    }

    // 3. Validação de esquema com Zod (se fornecido)
    if (toolDef.parametersSchema) {
      const parseResult = toolDef.parametersSchema.safeParse(params);
      if (!parseResult.success) {
        const issues = (parseResult.error as any).issues || (parseResult.error as any).errors || [];
        const errorMsg = issues.length > 0
          ? issues.map((e: any) => `${e.path?.join('.')}: ${e.message}`).join(', ')
          : parseResult.error.message;
        throw new Error(`INVALID_TOOL_PARAMETERS: Parâmetros inválidos para '${toolName}': ${errorMsg}`);
      }
    }

    // 4. Avaliação estrita pelo Policy Engine (Fail-Closed)
    const policyCheck = await maiaPolicyEngine.evaluateToolExecution(
      toolName,
      actor.instanceId,
      {
        nivelMinimoAutonomia: toolDef.nivelMinimoAutonomia,
        requerAprovacaoHumana: toolDef.requerAprovacaoHumana,
        riskLevel: toolDef.riskLevel
      }
    );

    if (!policyCheck.permitido) {
      const latencyMs = Date.now() - startTime;
      return {
        toolName,
        status: 'BLOCKED',
        mode: toolDef.mode,
        message: policyCheck.motivo || 'Execução bloqueada por política de governança.',
        latencyMs
      };
    }

    // 5. Verificação de Human-in-the-Loop obrigatório
    if (policyCheck.requerAprovacaoHumana) {
      const approvalReq = await maiaApprovalsRepository.createRequest({
        instanceId: actor.instanceId,
        toolName,
        params,
        requestedBy: {
          userId: actor.userId,
          name: actor.name,
          role: actor.role
        },
        policyVersion: `v${policyCheck.nivel}`
      });

      await auditoriaService.logEvent({
        instanceId: actor.instanceId,
        actorId: actor.userId,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'APPROVAL_REQUESTED',
        entityType: 'MAIA_APPROVAL',
        entityId: approvalReq.id,
        details: `Execução da ferramenta '${toolName}' (Risk: ${toolDef.riskLevel}) suspensa aguardando aprovação humana. Solicitação: ${approvalReq.id}.`,
        dadosPosteriores: {
          approvalId: approvalReq.id,
          status: 'PENDING_APPROVAL',
          toolName,
          riskLevel: toolDef.riskLevel,
          paramsHash: approvalReq.paramsHash,
          requestedBy: approvalReq.requestedBy
        },
        isMaiaAction: true
      });

      const latencyMs = Date.now() - startTime;
      return {
        toolName,
        status: 'PENDING_APPROVAL',
        mode: toolDef.mode,
        approvalId: approvalReq.id,
        message: `Ação suspensa aguardando aprovação humana prévia de supervisor (ID: ${approvalReq.id}).`,
        latencyMs
      };
    }

    // 6. Execução com timeout estrito
    try {
      const executionPromise = toolDef.execute(params, actor, options.context);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout de execução (${timeoutMs}ms) excedido para '${toolName}'`)), timeoutMs)
      );

      const rawResult = await Promise.race([executionPromise, timeoutPromise]);
      const latencyMs = Date.now() - startTime;

      // Zero Fake Success: Se a ferramenta opera em modo MOCK ou STUB, o status reporta com precisão
      const effectiveStatus = (rawResult as any)?.status === 'MOCK' ? 'MOCK'
        : ((rawResult as any)?.status === 'STUB' ? 'STUB'
        : ((rawResult as any)?.status === 'PARTIAL' ? 'PARTIAL' : 'EXECUTED'));

      return {
        toolName,
        status: effectiveStatus,
        mode: toolDef.mode,
        data: rawResult,
        latencyMs
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      console.warn(`[ToolGateway] Erro ao executar ferramenta '${toolName}':`, err?.message);
      return {
        toolName,
        status: 'ERROR',
        mode: toolDef.mode,
        error: err?.message,
        latencyMs
      };
    }
  }
}

export const toolGateway = new ToolGateway();
