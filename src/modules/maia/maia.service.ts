import { maiaPolicyEngine } from './policyEngine.ts';
import { executeMaiaTool } from './toolRegistry.ts';
import { auditoriaService } from '../auditoria/auditoria.service.ts';
import { instancesService } from '../instances/instances.service.ts';
import { planosService } from '../planos/planos.service.ts';
import { contatosRepository } from '../contatos/contatos.repository.ts';
import { dealsRepository } from '../deals/deals.repository.ts';
import { ActorContext } from '../auth/actorContext.ts';
import { getLlmProvider } from './llm/index.ts';

export interface MaiaChatInput {
  prompt: string;
  dealId?: string;
  contatoId?: string;
  context?: any;
}

export interface MaiaChatOutput {
  resposta: string;
  toolExecutada?: string;
  parametrosTool?: any;
  approvalId?: string;
  auditId?: string;
  nivelAutonomia: number;
}

class MaiaService {
  async processPrompt(
    input: MaiaChatInput,
    actor: ActorContext
  ): Promise<MaiaChatOutput> {
    if (!actor || !actor.instanceId) {
      throw new Error('Acesso negado à MaIA: Contexto de autorização ou instanceId ausente.');
    }

    // P0: Carregar nível persistente da instância (Fail-Closed se banco indisponível)
    const nivel = await maiaPolicyEngine.loadNivelForInstance(actor.instanceId);
    if (nivel === 0) {
      return {
        resposta: 'A MaIA está temporariamente desativada nesta instância por política do supervisor (N0).',
        nivelAutonomia: 0
      };
    }

    // Obter dados da instância estritamente contextualizados
    const instance = await instancesService.getInstance(actor.instanceId);
    const planos = await planosService.getAll(actor.instanceId);

    // P0: PARTE 14 & 18: Acesso contextual seguro com menor privilégio
    // NUNCA aceitar instanceId a partir do prompt ou context do payload
    const targetContato = input.contatoId
      ? await contatosRepository.getById(input.contatoId, actor.instanceId)
      : null;
    const targetDeal = input.dealId
      ? await dealsRepository.getById(input.dealId, actor.instanceId)
      : null;

    const systemContext = `
Você é a MaIA (Módulo de Automação e Inteligência Artificial) do Enlace-CRM.
Instância: ${instance.nomeFantasia} (Cidade Sede: ${instance.cidadeSede}-${instance.uf}).
Governança: Nível ${nivel}. Opera sob menor privilégio.
Planos disponíveis:
${planos.map(p => `- ${p.nome}: R$ ${p.precoMensal.toFixed(2)}/mês (${p.downloadMbps}M down)`).join('\n')}

${targetContato ? `Contato em foco: ${targetContato.nome}, Tel: ${targetContato.telefone}, CEP: ${targetContato.cep}` : ''}
${targetDeal ? `Negócio em foco: ${targetDeal.titulo}, Etapa: ${targetDeal.etapa}, Valor: R$ ${targetDeal.valorMensal}/mês` : ''}
`;

    let aiResponseText = '';
    let toolActionExecuted: any = null;
    let pendingApprovalId: string | undefined;

    // 1. Provider-Agnostic LLM Adapter (Gemini ou Adapter Futuro)
    try {
      const llm = getLlmProvider();
      const generated = await llm.generateText(input.prompt, systemContext);
      if (generated) {
        aiResponseText = generated;
      }
    } catch (llmError: any) {
      console.warn('[MaIA] LLM indisponível:', llmError?.message);
    }

    // 2. Fallback Heurístico Isolado (Apenas para Testes/Demo - Desativado em Produção)
    if (!aiResponseText) {
      if (process.env.NODE_ENV === 'production') {
        aiResponseText = `[MaIA Governança] Modelo de Inteligência Artificial indisponível no momento. O fallback heurístico automático é estritamente desativado em produção para garantir que nenhuma inferência seja simulada sem autoridade do modelo.`;
      } else {
        const fallbackResult = await this.executeHeuristicDemoFallback(input, actor, targetContato, targetDeal, instance, nivel);
        aiResponseText = fallbackResult.aiResponseText;
        toolActionExecuted = fallbackResult.toolActionExecuted;
        pendingApprovalId = fallbackResult.pendingApprovalId;
      }
    }

    // 3. Log Audit Trail for MaIA - Preserva a identidade do usuário solicitante
    const auditLog = await auditoriaService.logEvent({
      instanceId: actor.instanceId,
      actorId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'MAIA_INTERACTION_PROCESSED',
      entityType: 'MAIA_TOOL',
      entityId: input.dealId || input.contatoId || 'GENERAL',
      details: `Interação MaIA solicitada por ${actor.name}: "${input.prompt.substring(0, 70)}...". Ferramenta: ${toolActionExecuted?.name || (pendingApprovalId ? 'PENDING_APPROVAL' : 'CONVERSACIONAL')}`,
      isMaiaAction: true,
      dadosPosteriores: { 
        toolActionExecuted, 
        pendingApprovalId, 
        nivelAutonomia: nivel,
        solicitanteOriginal: { userId: actor.userId, name: actor.name, role: actor.role }
      }
    });

    return {
      resposta: aiResponseText,
      toolExecutada: toolActionExecuted?.name,
      parametrosTool: toolActionExecuted,
      approvalId: pendingApprovalId,
      auditId: auditLog.id,
      nivelAutonomia: nivel
    };
  }

  /**
   * Fallback Heurístico Isolado para Demonstração/Testes Locais.
   * Não deve ser executado em ambiente de produção (desativado em NODE_ENV=production).
   */
  private async executeHeuristicDemoFallback(
    input: MaiaChatInput,
    actor: ActorContext,
    targetContato: any,
    targetDeal: any,
    instance: any,
    nivel: number
  ): Promise<{ aiResponseText: string; toolActionExecuted?: any; pendingApprovalId?: string }> {
    const p = (input.prompt || '').toLowerCase();
    let aiResponseText = '';
    let toolActionExecuted: any = null;
    let pendingApprovalId: string | undefined;

    if (p.includes('viabilidade') || p.includes('cep') || p.includes('cto')) {
      const cepReal = targetContato?.cep || input.context?.cep;
      const numeroReal = targetContato?.numero || input.context?.numero;

      if (!cepReal || !numeroReal) {
        aiResponseText = '[MOCK/DEMO - Governança] Para simular a consulta de viabilidade técnica, é necessário informar o CEP e o número do imóvel.';
      } else {
        try {
          const execResult = await executeMaiaTool({
            toolName: 'consultar_viabilidade',
            params: {
              cep: cepReal,
              numero: numeroReal,
              contatoId: input.contatoId
            },
            actor
          });

          if (execResult.status === 'PENDING_APPROVAL') {
            pendingApprovalId = execResult.approvalId;
            aiResponseText = `[MOCK/DEMO - Governança] A consulta de viabilidade requer aprovação humana prévia (Solicitação: ${execResult.approvalId}).`;
          } else {
            toolActionExecuted = { name: 'consultar_viabilidade', ...execResult.data };
            aiResponseText = `[MOCK/DEMO - Telecom] Analisei a região informada. Estimativa teórica de viabilidade com base no endereço fornecido. Portas disponíveis: ${execResult.data.portasLivres ?? 4}.`;
          }
        } catch (err: any) {
          aiResponseText = `[MOCK/DEMO - Erro de Governança] ${err.message}`;
        }
      }
    } else if (p.includes('proposta') || p.includes('plano') || p.includes('preço')) {
      try {
        const execResult = await executeMaiaTool({
          toolName: 'recomendar_plano',
          params: {},
          actor
        });

        if (execResult.status === 'PENDING_APPROVAL') {
          pendingApprovalId = execResult.approvalId;
          aiResponseText = `[MOCK/DEMO - Governança] A recomendação de plano requer aprovação humana prévia (Solicitação: ${execResult.approvalId}).`;
        } else {
          toolActionExecuted = { name: 'recomendar_plano', ...execResult.data };
          aiResponseText = `[MOCK/DEMO - Telecom] Com base no catálogo oficial da sua instância, o plano mais indicado é **${execResult.data.plano}** (R$ ${execResult.data.precoMensal.toFixed(2)}/mês).`;
        }
      } catch (err: any) {
        aiResponseText = `[MOCK/DEMO - Erro de Governança] ${err.message}`;
      }
    } else if (p.includes('qualificar') || p.includes('score')) {
      if (input.contatoId) {
        try {
          const execResult = await executeMaiaTool({
            toolName: 'qualificar_lead',
            params: { contatoId: input.contatoId },
            actor
          });

          if (execResult.status === 'PENDING_APPROVAL') {
            pendingApprovalId = execResult.approvalId;
            aiResponseText = `[MOCK/DEMO - Governança] A qualificação do lead requer aprovação humana prévia (Solicitação: ${execResult.approvalId}).`;
          } else {
            toolActionExecuted = { name: 'qualificar_lead', ...execResult.data };
            aiResponseText = `[MOCK/DEMO - Telecom] Lead qualificado com **Score ${execResult.data.score}/100** (${execResult.data.temperatura}). ${execResult.data.resumo}`;
          }
        } catch (err: any) {
          aiResponseText = `[MOCK/DEMO - Erro de Governança] Falha na qualificação: ${err.message}`;
        }
      } else {
        aiResponseText = `[MOCK/DEMO - Telecom] Nenhum contato selecionado nesta instância para qualificação.`;
      }
    } else if (p.includes('desconto')) {
      if (!input.dealId) {
        aiResponseText = '[MOCK/DEMO - Governança] É necessário associar um negócio (Deal) válido da instância para simular ou solicitar aplicação de desconto.';
      } else {
        try {
          const execResult = await executeMaiaTool({
            toolName: 'aplicar_desconto_excecao',
            params: { dealId: input.dealId, desconto: 15 },
            actor
          });

          if (execResult.status === 'PENDING_APPROVAL') {
            pendingApprovalId = execResult.approvalId;
            aiResponseText = `[MOCK/DEMO - Governança] A aplicação de desconto requer aprovação humana prévia do supervisor (Solicitação: ${execResult.approvalId}).`;
          } else {
            toolActionExecuted = { name: 'aplicar_desconto_excecao', ...execResult.data };
            aiResponseText = `[MOCK/DEMO - Telecom] Simulação de desconto gerada com sucesso [AVISO: Modo Simulado/Demonstração]. Faturamento real não alterado.`;
          }
        } catch (err: any) {
          aiResponseText = `[MOCK/DEMO - Erro de Governança] ${err.message}`;
        }
      }
    } else {
      aiResponseText = `[MOCK/DEMO - MaIA v3.8] Solicitação recebida sob governança N${nivel}. Dados da operadora ${instance.nomeFantasia} verificados.`;
    }

    return { aiResponseText, toolActionExecuted, pendingApprovalId };
  }
}

export const maiaService = new MaiaService();
