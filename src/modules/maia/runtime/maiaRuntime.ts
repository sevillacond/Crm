import { ActorContext } from '../../auth/actorContext.ts';
import { AiRouter, aiRouter } from '../router/aiRouter.ts';
import { ToolGateway, toolGateway } from '../gateway/toolGateway.ts';
import { MaiaPolicyEngine, maiaPolicyEngine } from '../policyEngine.ts';
import { MaiaContextBuilder, maiaContextBuilder } from '../context/contextBuilder.ts';
import { MaiaMemoryRepository, maiaMemoryRepository } from '../memory/memory.repository.ts';
import { PromptInjectionDefense, promptInjectionDefense } from '../security/promptInjectionDefense.ts';
import { auditoriaService } from '../../auditoria/auditoria.service.ts';
import { env } from '../../../config/env.ts';

export interface MaiaRuntimeConfig {
  aiRouter?: AiRouter;
  toolGateway?: ToolGateway;
  policyEngine?: MaiaPolicyEngine;
  contextBuilder?: MaiaContextBuilder;
  memoryRepository?: MaiaMemoryRepository;
  injectionDefense?: PromptInjectionDefense;
}

export interface MaiaTurnInput {
  prompt: string;
  conversationId?: string;
  dealId?: string;
  contatoId?: string;
  domainContext?: {
    contato?: any;
    deal?: any;
    planos?: any[];
    custom?: Record<string, any>;
  };
  instance: {
    nomeFantasia: string;
    razaoSocial?: string;
    cidadeSede?: string;
    uf?: string;
    cnpj?: string;
  };
  context?: any;
}

export interface MaiaTurnOutput {
  resposta: string;
  status: 'SUCCESS' | 'BLOCKED' | 'PENDING_APPROVAL' | 'MOCK' | 'STUB' | 'ERROR' | 'UNAVAILABLE';
  conversationId: string;
  toolExecutada?: string;
  parametrosTool?: any;
  approvalId?: string;
  auditId?: string;
  nivelAutonomia: number;
  provider?: string;
  model?: string;
  latencyMs?: number;
}

export class MaiaRuntime {
  private aiRouter: AiRouter;
  private toolGateway: ToolGateway;
  private policyEngine: MaiaPolicyEngine;
  private contextBuilder: MaiaContextBuilder;
  private memoryRepository: MaiaMemoryRepository;
  private injectionDefense: PromptInjectionDefense;

  constructor(config?: MaiaRuntimeConfig) {
    this.aiRouter = config?.aiRouter || aiRouter;
    this.toolGateway = config?.toolGateway || toolGateway;
    this.policyEngine = config?.policyEngine || maiaPolicyEngine;
    this.contextBuilder = config?.contextBuilder || maiaContextBuilder;
    this.memoryRepository = config?.memoryRepository || maiaMemoryRepository;
    this.injectionDefense = config?.injectionDefense || promptInjectionDefense;
  }

  getGateway(): ToolGateway {
    return this.toolGateway;
  }

  getAiRouter(): AiRouter {
    return this.aiRouter;
  }

  getPolicyEngine(): MaiaPolicyEngine {
    return this.policyEngine;
  }

  async processTurn(input: MaiaTurnInput, actor: ActorContext): Promise<MaiaTurnOutput> {
    const startTime = Date.now();

    // 1. Validar integridade de contexto e isolamento de instância
    if (!actor || !actor.instanceId) {
      throw new Error('Acesso negado à MaIA: Contexto de autorização ou instanceId ausente.');
    }

    // 2. Defesa contra Prompt Injection & Delimiter Breakout
    const scan = this.injectionDefense.evaluatePrompt(input.prompt);
    if (scan.blocked) {
      // Registrar evento de segurança na auditoria
      await auditoriaService.logEvent({
        instanceId: actor.instanceId,
        actorId: actor.userId,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'MAIA_PROMPT_INJECTION_BLOCKED',
        entityType: 'SECURITY_INCIDENT',
        entityId: 'PROMPT_FILTER',
        details: `Tentativa de Prompt Injection bloqueada para usuário ${actor.name}: ${scan.reason}`,
        isMaiaAction: true,
        resultado: 'FALHA',
        dadosPosteriores: {
          promptOriginal: input.prompt.substring(0, 100),
          detectedPatterns: scan.detectedPatterns
        }
      });

      return {
        resposta: scan.reason || 'Solicitação bloqueada pelo motor de segurança da MaIA.',
        status: 'BLOCKED',
        conversationId: input.conversationId || 'none',
        nivelAutonomia: 0
      };
    }

    // 3. Avaliação da Política de Autonomia da Instância (Fail-Closed)
    const nivel = await this.policyEngine.loadNivelForInstance(actor.instanceId);
    if (nivel === 0) {
      return {
        resposta: 'A MaIA está temporariamente desativada nesta instância por política do supervisor (N0).',
        status: 'BLOCKED',
        conversationId: input.conversationId || 'none',
        nivelAutonomia: 0
      };
    }

    // 4. Gestão da Conversa e Memória Multiturn
    let conversationId = input.conversationId;
    if (!conversationId) {
      const conv = await this.memoryRepository.createConversation({
        instanceId: actor.instanceId,
        userId: actor.userId,
        title: input.prompt.substring(0, 40),
        dealId: input.dealId,
        contatoId: input.contatoId
      });
      conversationId = conv.id;
    } else {
      const existingConv = await this.memoryRepository.getConversationById(conversationId, actor.instanceId);
      if (!existingConv) {
        throw new Error(`Conversa ${conversationId} não encontrada para a instância ${actor.instanceId}.`);
      }
    }

    // Salvar mensagem do usuário na memória
    await this.memoryRepository.addMessage({
      conversationId,
      instanceId: actor.instanceId,
      role: 'user',
      content: scan.sanitizedPrompt
    });

    // Recuperar histórico de mensagens e compactar
    const rawHistory = await this.memoryRepository.getMessages(conversationId, actor.instanceId, 20);
    const compactedHistory = this.memoryRepository.compactMessages(rawHistory, 10);

    // 5. Construção Delimitada do Contexto
    const systemInstruction = this.contextBuilder.buildSystemInstruction({
      instance: input.instance,
      nivelAutonomia: nivel
    });

    const externalData = this.contextBuilder.buildExternalDataContext(input.domainContext);
    const fullPrompt = this.contextBuilder.buildPromptWithHistory(
      scan.sanitizedPrompt,
      compactedHistory.slice(0, -1), // não duplicar a última mensagem do usuário recém adicionada
      externalData
    );

    // 6. Chamada ao AI Router
    let aiResponseText = '';
    let providerUsed = 'none';
    let modelUsed = 'none';
    let toolActionExecuted: any = null;
    let pendingApprovalId: string | undefined;

    const routerResult = await this.aiRouter.generateText(fullPrompt, {
      systemInstruction,
      instanceId: actor.instanceId,
      actorId: actor.userId
    });

    if (routerResult && routerResult.status === 'SUCCESS' && routerResult.text) {
      aiResponseText = routerResult.text;
      providerUsed = routerResult.provider;
      modelUsed = routerResult.model;
    } else {
      if (env.NODE_ENV === 'production') {
        aiResponseText = `[MaIA Governança] Modelo de Inteligência Artificial indisponível no momento. O fallback heurístico automático é estritamente desativado em produção para garantir que nenhuma inferência seja simulada sem autoridade do modelo.`;
      } else {
        // Fallback Heurístico para Demonstração/Testes apenas em DEV/TEST
        const fb = await this.executeLocalHeuristicFallback(input, actor, nivel);
        aiResponseText = fb.aiResponseText;
        toolActionExecuted = fb.toolActionExecuted;
        pendingApprovalId = fb.pendingApprovalId;
        providerUsed = 'heuristic-demo-fallback';
        modelUsed = 'rules-engine-v2';
      }
    }

    // P0.12 Hardening: Garantir que qualquer menção a viabilidade técnica nunca declare portas reais
    const isViabilidade = /viabilidade|cto|cobertura|disponibilidade/i.test(scan.sanitizedPrompt);
    if (isViabilidade) {
      aiResponseText = aiResponseText.replace(/Portas disponíveis:\s*\d+/gi, 'Portas estimadas (simulação não-vinculante)');
      if (!aiResponseText.includes('MOCK') && !aiResponseText.includes('simulada') && !aiResponseText.includes('Aviso')) {
        aiResponseText += '\n\n[AVISO DE GOVERNANÇA: Estimativa teórica simulada (MOCK). Sujeito à vistoria técnica presencial.]';
      }
    }

    // 7. Salvar resposta na memória de conversa
    await this.memoryRepository.addMessage({
      conversationId,
      instanceId: actor.instanceId,
      role: 'assistant',
      content: aiResponseText,
      toolCalls: toolActionExecuted ? [toolActionExecuted] : null
    });

    // 8. Auditoria Criptográfica com Hash Chain
    const auditLog = await auditoriaService.logEvent({
      instanceId: actor.instanceId,
      actorId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'MAIA_INTERACTION_PROCESSED',
      entityType: 'MAIA_RUNTIME',
      entityId: conversationId,
      details: `MaIA Runtime processou turno para ${actor.name} (Nível N${nivel}): "${scan.sanitizedPrompt.substring(0, 60)}..."`,
      isMaiaAction: true,
      dadosPosteriores: {
        conversationId,
        providerUsed,
        modelUsed,
        toolActionExecuted,
        pendingApprovalId,
        nivelAutonomia: nivel,
        solicitanteOriginal: { userId: actor.userId, name: actor.name, role: actor.role }
      }
    });

    const totalLatency = Date.now() - startTime;
    const finalStatus = pendingApprovalId ? 'PENDING_APPROVAL' : (aiResponseText.includes('[MOCK') ? 'MOCK' : 'SUCCESS');

    return {
      resposta: aiResponseText,
      status: finalStatus,
      conversationId,
      toolExecutada: toolActionExecuted?.name,
      parametrosTool: toolActionExecuted,
      approvalId: pendingApprovalId,
      auditId: auditLog.id,
      nivelAutonomia: nivel,
      provider: providerUsed,
      model: modelUsed,
      latencyMs: totalLatency
    };
  }

  private async executeLocalHeuristicFallback(
    input: MaiaTurnInput,
    actor: ActorContext,
    nivel: number
  ): Promise<{ aiResponseText: string; toolActionExecuted?: any; pendingApprovalId?: string }> {
    const p = (input.prompt || '').toLowerCase();
    let aiResponseText = '';
    let toolActionExecuted: any = null;
    let pendingApprovalId: string | undefined;

    if (p.includes('viabilidade') || p.includes('cep') || p.includes('cto')) {
      const cepMatch = (input.prompt || '').match(/\d{5}-?\d{3}|\d{8}/);
      const numMatch = (input.prompt || '').match(/(?:numero|número|n[ºo]|n\.)\s*(\d+)/i) || (input.prompt || '').match(/,\s*(\d+)/);
      const cepReal = input.domainContext?.contato?.cep || input.context?.cep || (cepMatch ? cepMatch[0] : null);
      const numeroReal = input.domainContext?.contato?.numero || input.context?.numero || (numMatch ? numMatch[1] : null);

      if (!cepReal || !numeroReal) {
        aiResponseText = '[MOCK/DEMO - Governança] Para simular a consulta de viabilidade técnica, é necessário informar o CEP e o número do imóvel.';
      } else {
        const result = await this.toolGateway.executeTool({
          toolName: 'consultar_viabilidade',
          params: { cep: cepReal, numero: numeroReal, contatoId: input.contatoId },
          actor
        });

        if (result.status === 'PENDING_APPROVAL') {
          pendingApprovalId = result.approvalId;
          aiResponseText = `[MOCK/DEMO - Governança] A consulta de viabilidade requer aprovação humana prévia (Solicitação: ${result.approvalId}).`;
        } else {
          toolActionExecuted = { name: 'consultar_viabilidade', ...result.data };
          aiResponseText = `[MOCK/DEMO - Estimativa Simulada] Realizada estimativa teórica simulada (MOCK). Aviso: Integração GIS/SGP não conectada. Não é possível confirmar disponibilidade física de portas de CTO sem vistoria técnica de campo.`;
        }
      }
    } else if (p.includes('proposta') || p.includes('plano') || p.includes('preço')) {
      const result = await this.toolGateway.executeTool({
        toolName: 'recomendar_plano',
        params: {},
        actor
      });

      if (result.status === 'PENDING_APPROVAL') {
        pendingApprovalId = result.approvalId;
        aiResponseText = `[MOCK/DEMO - Governança] A recomendação de plano requer aprovação humana prévia (Solicitação: ${result.approvalId}).`;
      } else {
        toolActionExecuted = { name: 'recomendar_plano', ...result.data };
        aiResponseText = `[MOCK/DEMO - Telecom] Com base no catálogo oficial da sua instância, o plano mais indicado é **${result.data?.plano}** (R$ ${result.data?.precoMensal?.toFixed(2)}/mês).`;
      }
    } else if (p.includes('qualificar') || p.includes('score')) {
      if (input.contatoId) {
        const result = await this.toolGateway.executeTool({
          toolName: 'qualificar_lead',
          params: { contatoId: input.contatoId },
          actor
        });

        if (result.status === 'PENDING_APPROVAL') {
          pendingApprovalId = result.approvalId;
          aiResponseText = `[MOCK/DEMO - Governança] A qualificação do lead requer aprovação humana prévia (Solicitação: ${result.approvalId}).`;
        } else {
          toolActionExecuted = { name: 'qualificar_lead', ...result.data };
          aiResponseText = `[MOCK/DEMO - Telecom] Lead qualificado com **Score ${result.data?.score}/100** (${result.data?.temperatura}). ${result.data?.resumo}`;
        }
      } else {
        aiResponseText = `[MOCK/DEMO - Telecom] Nenhum contato selecionado nesta instância para qualificação.`;
      }
    } else if (p.includes('desconto')) {
      if (!input.dealId) {
        aiResponseText = '[MOCK/DEMO - Governança] É necessário associar um negócio (Deal) válido da instância para simular ou solicitar aplicação de desconto.';
      } else {
        const result = await this.toolGateway.executeTool({
          toolName: 'aplicar_desconto_excecao',
          params: { dealId: input.dealId, desconto: 15 },
          actor
        });

        if (result.status === 'PENDING_APPROVAL') {
          pendingApprovalId = result.approvalId;
          aiResponseText = `[MOCK/DEMO - Governança] A aplicação de desconto requer aprovação humana prévia do supervisor (Solicitação: ${result.approvalId}).`;
        } else {
          toolActionExecuted = { name: 'aplicar_desconto_excecao', ...result.data };
          aiResponseText = `[MOCK/DEMO - Telecom] Simulação de desconto gerada com sucesso [AVISO: Modo Simulado/Demonstração]. Faturamento real não alterado.`;
        }
      }
    } else {
      aiResponseText = `[MOCK/DEMO - MaIA Runtime] Solicitação recebida sob governança N${nivel}. Dados da operadora ${input.instance.nomeFantasia} verificados.`;
    }

    return { aiResponseText, toolActionExecuted, pendingApprovalId };
  }
}

export const maiaRuntime = new MaiaRuntime();
