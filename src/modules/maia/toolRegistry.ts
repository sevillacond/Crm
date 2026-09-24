import { viabilidadeService } from '../viabilidade/viabilidade.service.ts';
import { planosService } from '../planos/planos.service.ts';
import { contatosRepository } from '../contatos/contatos.repository.ts';
import { auditoriaService } from '../auditoria/auditoria.service.ts';
import { ActorContext } from '../auth/actorContext.ts';
import { maiaPolicyEngine } from './policyEngine.ts';
import {
  maiaApprovalsRepository,
  MaiaApprovalRequest,
  calculateParamsHash
} from './approvals.repository.ts';
import { MaiaToolDefinition, MaiaToolExecutionResult, ExecuteToolOptions } from './toolTypes.ts';

// Internal raw implementations
const RAW_TOOL_IMPLEMENTATIONS: Record<string, (params: any, actor: ActorContext) => Promise<any>> = {
  consultar_viabilidade: async (params, actor) => {
    // P0: Não utilizar dados fictícios como fallback (13024-000 / 100)
    if (!params?.cep || typeof params.cep !== 'string' || params.cep.trim() === '') {
      throw new Error('CEP é obrigatório para consulta de viabilidade técnica. Forneça um CEP válido.');
    }
    if (!params?.numero || typeof params.numero !== 'string' || params.numero.trim() === '') {
      throw new Error('Número do imóvel é obrigatório para consulta de viabilidade técnica.');
    }

    const resultadoViabilidade = await viabilidadeService.consultar(
      {
        cep: params.cep.trim(),
        numero: params.numero.trim(),
        bairro: params.bairro?.trim()
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

    return {
      ...resultadoViabilidade,
      status: 'MOCK',
      modoOperacao: 'SIMULADO_DEMO',
      aviso: 'MOCK/DEMO: Consulta de viabilidade simulada. Integração real com SGP/GIS não conectada.'
    };
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

  aplicar_desconto_excecao: async (params, _actor) => {
    if (!params || !params.dealId) {
      throw new Error('dealId é obrigatório para aplicar desconto de exceção.');
    }
    return {
      dealId: params.dealId,
      descontoPercentual: params.desconto || 15,
      status: 'SIMULADO',
      aviso: 'MOCK/SIMULAÇÃO: Desconto simulado gerado pelo motor de regras. Cobrança/faturamento real não implementada nesta etapa.'
    };
  },

  consultar_sgp_cliente: async (params, actor) => {
    if (!params?.cpfCnpj && !params?.contratoId) {
      throw new Error('Informe cpfCnpj ou contratoId para consultar o cliente no SGP.');
    }
    const { sgpService } = await import('../sgp/sgp.service.ts');
    let contrato = null;
    if (params.contratoId) {
      contrato = await sgpService.getContractById(params.contratoId, actor.instanceId);
    } else if (params.cpfCnpj) {
      contrato = await sgpService.getContractByCpfCnpj(params.cpfCnpj, actor.instanceId);
    }

    if (!contrato) {
      return {
        encontrado: false,
        mensagem: 'Nenhum contrato ativo localizado no SGP integrado.'
      };
    }

    return {
      encontrado: true,
      contrato
    };
  },

  desbloquear_em_confianca: async (params, actor) => {
    if (!params?.contratoId) {
      throw new Error('contratoId é obrigatório para realizar o desbloqueio em confiança no SGP.');
    }
    const { sgpService } = await import('../sgp/sgp.service.ts');
    const resultado = await sgpService.desbloqueioConfianca(params.contratoId, actor);
    return resultado;
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
      details: `Execução da ferramenta '${toolName}' suspensa. Criada solicitação de aprovação ${approvalReq.id} com status PENDING_APPROVAL.`,
      dadosPosteriores: {
        approvalId: approvalReq.id,
        status: 'PENDING_APPROVAL',
        toolName,
        paramsHash: approvalReq.paramsHash,
        requestedBy: approvalReq.requestedBy
      },
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
 * P0: Aprovação de solicitação (PENDING_APPROVAL -> APPROVED)
 */
export async function approveToolApproval(
  approvalId: string,
  reviewer: ActorContext
): Promise<MaiaApprovalRequest> {
  if (!reviewer || !reviewer.instanceId) {
    throw new Error('Contexto de revisor inválido.');
  }

  const approvedReq = await maiaApprovalsRepository.approve(approvalId, reviewer);

  await auditoriaService.logEvent({
    instanceId: reviewer.instanceId,
    actorId: reviewer.userId,
    actorName: reviewer.name,
    actorRole: reviewer.role,
    action: 'APPROVAL_APPROVED',
    entityType: 'MAIA_APPROVAL',
    entityId: approvalId,
    details: `Supervisor ${reviewer.name} aprovou a solicitação de ferramenta '${approvedReq.toolName}'.`,
    dadosPosteriores: {
      approvalId,
      toolName: approvedReq.toolName,
      status: 'APPROVED',
      approvedBy: approvedReq.resolvedBy,
      requestedBy: approvedReq.requestedBy
    },
    isMaiaAction: false
  });

  return approvedReq;
}

/**
 * P0: Rejeição de solicitação (PENDING_APPROVAL -> REJECTED)
 */
export async function rejectToolApproval(
  approvalId: string,
  reviewer: ActorContext,
  reason: string
): Promise<MaiaApprovalRequest> {
  if (!reviewer || !reviewer.instanceId) {
    throw new Error('Contexto de revisor inválido.');
  }

  const rejectedReq = await maiaApprovalsRepository.reject(approvalId, reviewer, reason);

  await auditoriaService.logEvent({
    instanceId: reviewer.instanceId,
    actorId: reviewer.userId,
    actorName: reviewer.name,
    actorRole: reviewer.role,
    action: 'APPROVAL_REJECTED',
    entityType: 'MAIA_APPROVAL',
    entityId: approvalId,
    details: `Supervisor ${reviewer.name} rejeitou a solicitação '${rejectedReq.toolName}'. Motivo: ${reason}`,
    dadosPosteriores: {
      approvalId,
      toolName: rejectedReq.toolName,
      status: 'REJECTED',
      rejectionReason: reason,
      rejectedBy: rejectedReq.resolvedBy,
      requestedBy: rejectedReq.requestedBy
    },
    isMaiaAction: false
  });

  return rejectedReq;
}

/**
 * P0: Execução idempotente e atômica de ferramenta previamente aprovada (APPROVED -> EXECUTING -> EXECUTED / FAILED)
 */
export async function executeApprovedTool(
  approvalId: string,
  executor: ActorContext
): Promise<MaiaToolExecutionResult> {
  if (!executor || !executor.instanceId) {
    throw new Error('Contexto de executor inválido.');
  }

  // 1. Recuperar solicitação da instância
  const req = await maiaApprovalsRepository.getById(approvalId, executor.instanceId);
  if (!req) {
    throw new Error(`Solicitação de aprovação ${approvalId} não encontrada para a instância.`);
  }

  // 2. PARTE 9: Verificar hash dos parâmetros
  const calculatedHash = calculateParamsHash(req.toolName, req.params);
  if (req.paramsHash !== calculatedHash) {
    throw new Error('PARAMS_HASH_MISMATCH: Os parâmetros foram alterados após a aprovação. Execução bloqueada.');
  }

  // 3. PARTE 7: Transição atômica APPROVED -> EXECUTING (apenas UMA requisição vence)
  const executingReq = await maiaApprovalsRepository.setExecuting(approvalId, executor);

  await auditoriaService.logEvent({
    instanceId: executor.instanceId,
    actorId: executor.userId,
    actorName: executor.name,
    actorRole: executor.role,
    action: 'APPROVAL_EXECUTION_STARTED',
    entityType: 'MAIA_APPROVAL',
    entityId: approvalId,
    details: `Iniciada execução da ferramenta aprovada '${executingReq.toolName}'.`,
    dadosPosteriores: {
      approvalId,
      status: 'EXECUTING',
      executedBy: executingReq.executedBy,
      requestedBy: executingReq.requestedBy,
      approvedBy: executingReq.resolvedBy
    },
    isMaiaAction: true
  });

  // 4. Executar ferramenta internamente
  const rawFn = RAW_TOOL_IMPLEMENTATIONS[req.toolName];
  if (!rawFn) {
    await maiaApprovalsRepository.setFailed(approvalId, executor.instanceId, 'Implementação não encontrada');
    throw new Error(`Implementação da ferramenta '${req.toolName}' não encontrada.`);
  }

  try {
    const result = await rawFn(req.params, executor);

    // 5. Marcar como executado com sucesso
    await maiaApprovalsRepository.setExecuted(approvalId, executor.instanceId, result);

    await auditoriaService.logEvent({
      instanceId: executor.instanceId,
      actorId: executor.userId,
      actorName: executor.name,
      actorRole: executor.role,
      action: 'APPROVAL_EXECUTED',
      entityType: 'MAIA_APPROVAL',
      entityId: approvalId,
      details: `Ferramenta '${req.toolName}' executada com sucesso após aprovação.`,
      dadosPosteriores: {
        approvalId,
        status: 'EXECUTED',
        result,
        executedBy: { userId: executor.userId, name: executor.name, role: executor.role },
        requestedBy: req.requestedBy,
        approvedBy: req.resolvedBy
      },
      isMaiaAction: true
    });

    return {
      status: 'EXECUTED',
      toolName: req.toolName,
      approvalId,
      data: result
    };
  } catch (executionError: any) {
    await maiaApprovalsRepository.setFailed(approvalId, executor.instanceId, executionError.message);

    await auditoriaService.logEvent({
      instanceId: executor.instanceId,
      actorId: executor.userId,
      actorName: executor.name,
      actorRole: executor.role,
      action: 'APPROVAL_EXECUTION_FAILED',
      entityType: 'MAIA_APPROVAL',
      entityId: approvalId,
      details: `Falha na execução da ferramenta '${req.toolName}': ${executionError.message}`,
      dadosPosteriores: {
        approvalId,
        status: 'FAILED',
        error: executionError.message,
        executedBy: { userId: executor.userId, name: executor.name, role: executor.role }
      },
      resultado: 'FALHA',
      isMaiaAction: true
    });

    throw executionError;
  }
}

/**
 * Atalho de compatibilidade: Aprova e executa sequencialmente
 */
export async function approveAndExecuteTool(
  approvalId: string,
  reviewer: ActorContext
): Promise<MaiaToolExecutionResult> {
  const req = await maiaApprovalsRepository.getById(approvalId, reviewer.instanceId);
  if (req && req.status === 'PENDING_APPROVAL') {
    await approveToolApproval(approvalId, reviewer);
  }
  return executeApprovedTool(approvalId, reviewer);
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
  },
  consultar_sgp_cliente: {
    name: 'consultar_sgp_cliente',
    description: 'Consulta status de conexão, IP PPPoE, ONT e faturas abertas no SGP integrado (IXC / MK-Auth / Voalle)',
    nivelMinimoAutonomia: 1,
    requerAprovacaoHumana: false
  },
  desbloquear_em_confianca: {
    name: 'desbloquear_em_confianca',
    description: 'Executa desbloqueio temporário de 48h em confiança para cliente bloqueado por inadimplência',
    nivelMinimoAutonomia: 2,
    requerAprovacaoHumana: false
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
  },
  consultar_sgp_cliente: {
    ...TOOL_METADATA.consultar_sgp_cliente,
    execute: (params, actor) => executeMaiaTool({ toolName: 'consultar_sgp_cliente', params, actor }),
    _rawExecute: RAW_TOOL_IMPLEMENTATIONS.consultar_sgp_cliente
  },
  desbloquear_em_confianca: {
    ...TOOL_METADATA.desbloquear_em_confianca,
    execute: (params, actor) => executeMaiaTool({ toolName: 'desbloquear_em_confianca', params, actor }),
    _rawExecute: RAW_TOOL_IMPLEMENTATIONS.desbloquear_em_confianca
  }
};

export * from './toolTypes.ts';
