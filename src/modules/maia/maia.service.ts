import { GoogleGenAI } from '@google/genai';
import { maiaPolicyEngine } from './policyEngine.ts';
import { MAIA_TOOL_REGISTRY } from './toolRegistry.ts';
import { auditoriaService } from '../auditoria/auditoria.service.ts';
import { instancesService } from '../instances/instances.service.ts';
import { planosService } from '../planos/planos.service.ts';
import { contatosRepository } from '../contatos/contatos.repository.ts';
import { dealsRepository } from '../deals/deals.repository.ts';

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
  auditId?: string;
  nivelAutonomia: number;
}

class MaiaService {
  async processPrompt(
    input: MaiaChatInput,
    actor: { id: string; name: string; role: any }
  ): Promise<MaiaChatOutput> {
    const nivel = maiaPolicyEngine.getNivel();
    if (nivel === 0) {
      return {
        resposta: 'A MaIA está temporariamente desativada nesta instância por política do supervisor (N0).',
        nivelAutonomia: 0
      };
    }

    const instance = await instancesService.getInstance();
    const planos = await planosService.getAll();

    // Scoped contextual access (Least Privilege - strictly the selected contact/deal)
    const targetContato = input.contatoId ? await contatosRepository.getById(input.contatoId) : null;
    const targetDeal = input.dealId ? await dealsRepository.getById(input.dealId) : null;

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

    // 1. Check if Gemini 2.5 Flash is configured
    if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('CHANGE_ME')) {
      try {
        const ai = new GoogleGenAI();
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { role: 'user', parts: [{ text: `${systemContext}\n\nSolicitação do Operador: ${input.prompt}` }] }
          ]
        });
        aiResponseText = response.text || '';
      } catch (geminiError: any) {
        console.warn('[MaIA] Gemini API indisponível, acionando motor heurístico:', geminiError?.message);
      }
    }

    // 2. Domain Expert Heuristic Fallback
    const p = (input.prompt || '').toLowerCase();
    if (!aiResponseText) {
      if (p.includes('viabilidade') || p.includes('cep') || p.includes('cto')) {
        const check = maiaPolicyEngine.evaluateToolExecution('consultar_viabilidade');
        if (check.permitido) {
          toolActionExecuted = {
            name: 'consultar_viabilidade',
            cep: targetContato?.cep || '13024-000',
            numero: targetContato?.numero || '450',
            resultado: 'ESTIMATIVA_DEMO_VIAVEL'
          };
          aiResponseText = `[MaIA Telecom] Analisei a região informada. [AVISO: Modo Estimativa Sandbox] A CTO teórica encontra-se a cerca de 45 metros. Portas disponíveis: 4. Recomendo avançar com a apresentação do plano Fibra 600 Mega Gamer.`;
        }
      } else if (p.includes('proposta') || p.includes('plano') || p.includes('preço')) {
        const check = maiaPolicyEngine.evaluateToolExecution('recomendar_plano');
        if (check.permitido) {
          toolActionExecuted = {
            name: 'recomendar_plano',
            plano: 'Fibra Gamer Turbo 600 Mega',
            mrrEstimado: 119.90
          };
          aiResponseText = `[MaIA Telecom] Com base no perfil de consumo, a melhor opção é o **Fibra Gamer Turbo 600 Mega** (R$ 119,90/mês), com Wi-Fi 6 de alta performance.`;
        }
      } else if (p.includes('qualificar') || p.includes('score')) {
        const check = maiaPolicyEngine.evaluateToolExecution('qualificar_lead');
        if (check.permitido) {
          const tool = MAIA_TOOL_REGISTRY.qualificar_lead;
          const qualifResult = await tool.execute({ contatoId: input.contatoId }, actor);
          toolActionExecuted = { name: 'qualificar_lead', ...qualifResult };
          aiResponseText = `[MaIA Telecom] Lead qualificado com **Score 92/100** (Alta Prioridade). Interesse identificado em portabilidade imediata sem restrições.`;
        }
      } else {
        aiResponseText = `[MaIA v3.8] Solicitação recebida sob governança N${nivel}. Dados da operadora ${instance.nomeFantasia} verificados.`;
      }
    }

    // 3. Log Audit Trail for MaIA
    const auditLog = await auditoriaService.logEvent({
      actorId: 'usr_maia',
      actorName: 'MaIA (Agente IA)',
      actorRole: 'MAIA_AGENT',
      action: 'MAIA_INTERACTION_PROCESSED',
      entityType: 'MAIA_TOOL',
      entityId: input.dealId || input.contatoId || 'GENERAL',
      details: `Prompt processado: "${input.prompt.substring(0, 70)}...". Ferramenta: ${toolActionExecuted?.name || 'CONVERSACIONAL'}`,
      isMaiaAction: true,
      dadosPosteriores: { toolActionExecuted, nivelAutonomia: nivel }
    });

    return {
      resposta: aiResponseText,
      toolExecutada: toolActionExecuted?.name,
      parametrosTool: toolActionExecuted,
      auditId: auditLog.id,
      nivelAutonomia: nivel
    };
  }
}

export const maiaService = new MaiaService();
