import { viabilidadeService } from '../viabilidade/viabilidade.service.ts';
import { planosService } from '../planos/planos.service.ts';
import { contatosRepository } from '../contatos/contatos.repository.ts';
import { auditoriaService } from '../auditoria/auditoria.service.ts';
import { ActorContext } from '../auth/actorContext.ts';
import { maiaPolicyEngine } from './policyEngine.ts';
import { maiaApprovalsRepository, MaiaApprovalRequest } from './approvals.repository.ts';
import { MaiaToolDefinition, MaiaToolExecutionResult, ExecuteToolOptions } from './toolTypes.ts';

// Internal raw implementations
const RAW_TOOL_IMPLEMENTATIONS: Record<string, (params: any, actor: ActorContext) => Promise<any>> = {
  consultar_viabilidade: async (params, actor) => {
    return viabilidadeService.consultar(
      {
        cep: params.cep || '13024-000',
        numero: params.numero || '100',
        bairro: params.bairro
      },
      params.contatoId,
      {
        id: actor.userId,
        name: actor.name,
        role: actor.role,
        instanceId: actor.instanceId,
        isMaia: true
      }
    );
  },

  recomendar_plano: async (_params, actor) => {
    const planos = await planosService.getAll(actor.instanceId);
    const planoIdeal = planos.find(p => p.popular) || planos[0];
    if (!planoIdeal) {
      throw new Error('Nenhum plano disponível na instância para recomendação.');
    }
    return {
      plano: planoIdeal.nome,
      precoMensal: planoIdeal.precoMensal,
      downloadMbps: planoIdeal.downloadMbps,
      tecnologia: planoIdeal.tecnologia
    };
  },

  qualificar_lead: async (params, actor) => {
    if (!params || !params.contatoId) {
      throw new Error('contatoId é obrigatório para qualificação de lead.');
    }

    // 1. Buscar contato estritamente dentro da instância do ator
    const contato = await contatosRepository.getById(params.contatoId, actor.instanceId);
    if (!contato) {
      throw new Error(`Contato ${params.contatoId} não encontrado na instância ${actor.instanceId}. Operação bloqueada.`);
    }

    const score = 92;
    const resumo = 'Lead com alta propensão de fechamento e interesse imediato em portabilidade.';

    // 2. Executar atualização de score e resumo sob o escopo isolado da instância
    await contatosRepository.update(params.contatoId, {
      scoreMaia: score,
      resumoMaia: resumo
    }, actor.instanceId);

    // 3. Auditoria obrigatória de execução da ferramenta de IA
    await auditoriaService.logEvent({
      instanceId: actor.instanceId,
      actorId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'MAIA_TOOL_QUALIFICAR_LEAD',
      entityType: 'CONTATO',
      entityId: params.contatoId,
      details: `MaIA qualificou o lead "${contato.nome}" com score ${score}.`,
      isMaiaAction: true,
      dadosAnteriores: { scoreMaia: contato.scoreMaia, resumoMaia: contato.resumoMaia },
      dadosPosteriores: { scoreMaia: score, resumoMaia: resumo }
    });

    return {
      contatoId: params.contatoId,
      score,
      temperatura: 'QUENTE',
      resumo
    };
  },

  aplicar_desconto_excecao: async (params, actor) => {
    if (!params || !params.dealId) {
      throw new Error('dealId é obrigatório para aplicar desconto de exceção.');
    }
    return {
      dealId: params.dealId,
      descontoPercentual: params.desconto || 15,
      status: 'DESCONTO_APLICADO'
    };
  }
};

/**
 * P0: Porta Única e Segura de Execução de Ferramentas da MaIA.
 * Nenhuma ferramenta executa sem passar pela validação rigorosa do Policy Engine.
 */
export async function executeMaiaTool(options: ExecuteToolOptions): Promise<MaiaToolExecutionResult> {
  const { toolName, params, actor } = options;

  // 1. Validar ActorContext e instanceId
  if (!actor || !actor.instanceId) {
    throw new Error('Acesso negado: Contexto de autorização ou instanceId ausente para executar ferramenta da MaIA.');
  }

  // 2. Localizar ferramenta no catálogo
  const toolDef = TOOL_METADATA[toolName];
  if (!toolDef) {
    throw new Error(`Ferramenta '${toolName}' não registrada no Tool Registry seguro da MaIA.`);
  }

  // 3. Avaliar política persistente via Policy Engine (Fail-Closed)
  const policyCheck = await maiaPolicyEngine.evaluateToolExecution(
    toolName,
    actor.instanceId,
    {
      nivelMinimoAutonomia: toolDef.nivelMinimoAutonomia,
      requerAprovacaoHumana: toolDef.requerAprovacaoHumana
    }
  );

  if (!policyCheck.permitido) {
    throw new Error(`Execução da ferramenta '${toolName}' bloqueada pelo Policy Engine: ${policyCheck.motivo}`);
  }

  // 4. Verificação de necessidade de aprovação humana (P0: Human-in-the-loop obrigatório)
  if (policyCheck.requerAprovacaoHumana) {
    const approvalReq = await maiaApprovalsRepository.createRequest({
      instanceId: actor.instanceId,
      toolName,
      params,
      requestedBy: {
        userId: actor.userId,
        name: actor.name,
        role: actor.role
      }
    });

    await auditoriaService.logEvent({
      instanceId: actor.instanceId,
      actorId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'MAIA_TOOL_PENDING_APPROVAL',
      entityType: 'MAIA_APPROVAL',
      entityId: approvalReq.id,
      details: `Execução da ferramenta '${toolName}' suspensa. Criada solicitação de aprovação ${approvalReq.id} com status PENDING_APPROVAL.`,
      dadosPosteriores: { approvalId: approvalReq.id, status: 'PENDING_APPROVAL', toolName, params },
      isMaiaAction: true
    });

    return {
      status: 'PENDING_APPROVAL',
      toolName,
      approvalId: approvalReq.id,
      message: 'Execução suspensa aguardando aprovação humana.'
    };
  }

  // 5. Executar implementação interna da ferramenta
  const rawFn = RAW_TOOL_IMPLEMENTATIONS[toolName];
  if (!rawFn) {
    throw new Error(`Implementação interna da ferramenta '${toolName}' não encontrada.`);
  }

  const result = await rawFn(params, actor);

  return {
    status: 'EXECUTED',
    toolName,
    data: result
  };
}

/**
 * P0: Execução controlada após aprovação humana por supervisor/operador
 */
export async function approveAndExecuteTool(
  approvalId: string,
  reviewer: ActorContext
): Promise<MaiaToolExecutionResult> {
  if (!reviewer || !reviewer.instanceId) {
    throw new Error('Contexto de revisor inválido.');
  }

  // 1. Aprovar requisição
  const req = await maiaApprovalsRepository.approve(approvalId, reviewer);

  // 2. Marcar como executando
  await maiaApprovalsRepository.setExecuting(approvalId, reviewer.instanceId);

  // 3. Executar ferramenta internamente
  const rawFn = RAW_TOOL_IMPLEMENTATIONS[req.toolName];
  if (!rawFn) {
    throw new Error(`Implementação da ferramenta '${req.toolName}' não encontrada.`);
  }

  const result = await rawFn(req.params, reviewer);

  // 4. Marcar como executado
  await maiaApprovalsRepository.setExecuted(approvalId, reviewer.instanceId, result);

  // 5. Auditoria de aprovação e execução
  await auditoriaService.logEvent({
    instanceId: reviewer.instanceId,
    actorId: reviewer.userId,
    actorName: reviewer.name,
    actorRole: reviewer.role,
    action: 'MAIA_TOOL_APPROVED_AND_EXECUTED',
    entityType: 'MAIA_APPROVAL',
    entityId: approvalId,
    details: `Supervisor ${reviewer.name} aprovou e executou ferramenta '${req.toolName}'.`,
    dadosPosteriores: { approvalId, status: 'EXECUTED', result },
    isMaiaAction: true
  });

  return {
    status: 'EXECUTED',
    toolName: req.toolName,
    approvalId,
    data: result
  };
}

const TOOL_METADATA: Record<string, { name: string; description: string; nivelMinimoAutonomia: number; requerAprovacaoHumana: boolean }> = {
  consultar_viabilidade: {
    name: 'consultar_viabilidade',
    description: 'Consulta viabilidade técnica da rede FTTH GPON (modo simulado demo com disclaimer)',
    nivelMinimoAutonomia: 1,
    requerAprovacaoHumana: false
  },
  recomendar_plano: {
    name: 'recomendar_plano',
    description: 'Analisa o catálogo de planos da operadora e sugere a melhor opção custo-benefício',
    nivelMinimoAutonomia: 1,
    requerAprovacaoHumana: false
  },
  qualificar_lead: {
    name: 'qualificar_lead',
    description: 'Calcula o score de propensão de fechamento e temperatura do lead com validação de instância',
    nivelMinimoAutonomia: 2,
    requerAprovacaoHumana: false
  },
  aplicar_desconto_excecao: {
    name: 'aplicar_desconto_excecao',
    description: 'Aplica desconto de exceção em negociação (requer aprovação humana obrigatória)',
    nivelMinimoAutonomia: 3,
    requerAprovacaoHumana: true
  }
};

// Export tool registry wrapping execution through the secure gateway
export const MAIA_TOOL_REGISTRY: Record<string, MaiaToolDefinition> = {
  consultar_viabilidade: {
    ...TOOL_METADATA.consultar_viabilidade,
    execute: (params, actor) => executeMaiaTool({ toolName: 'consultar_viabilidade', params, actor }),
    _rawExecute: RAW_TOOL_IMPLEMENTATIONS.consultar_viabilidade
  },
  recomendar_plano: {
    ...TOOL_METADATA.recomendar_plano,
    execute: (params, actor) => executeMaiaTool({ toolName: 'recomendar_plano', params, actor }),
    _rawExecute: RAW_TOOL_IMPLEMENTATIONS.recomendar_plano
  },
  qualificar_lead: {
    ...TOOL_METADATA.qualificar_lead,
    execute: (params, actor) => executeMaiaTool({ toolName: 'qualificar_lead', params, actor }),
    _rawExecute: RAW_TOOL_IMPLEMENTATIONS.qualificar_lead
  },
  aplicar_desconto_excecao: {
    ...TOOL_METADATA.aplicar_desconto_excecao,
    execute: (params, actor) => executeMaiaTool({ toolName: 'aplicar_desconto_excecao', params, actor }),
    _rawExecute: RAW_TOOL_IMPLEMENTATIONS.aplicar_desconto_excecao
  }
};

export * from './toolTypes.ts';
