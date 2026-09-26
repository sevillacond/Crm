import { maiaRuntime } from './runtime/maiaRuntime.ts';
import { instancesService } from '../instances/instances.service.ts';
import { planosService } from '../planos/planos.service.ts';
import { contatosRepository } from '../contatos/contatos.repository.ts';
import { dealsRepository } from '../deals/deals.repository.ts';
import { ActorContext } from '../auth/actorContext.ts';
import { maiaPolicyEngine } from './policyEngine.ts';

export interface MaiaChatInput {
  prompt: string;
  dealId?: string;
  contatoId?: string;
  context?: any;
  conversationId?: string;
}

export interface MaiaChatOutput {
  resposta: string;
  toolExecutada?: string;
  parametrosTool?: any;
  approvalId?: string;
  auditId?: string;
  nivelAutonomia: number;
  conversationId?: string;
  status?: string;
  provider?: string;
  model?: string;
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
        nivelAutonomia: 0,
        status: 'BLOCKED'
      };
    }

    // Obter dados da instância estritamente contextualizados
    const instance = await instancesService.getInstance(actor.instanceId);
    const planos = await planosService.getAll(actor.instanceId);

    // P0: Menor privilégio: Acesso restrito e contextualizado dentro da instância do ator
    const targetContato = input.contatoId
      ? await contatosRepository.getById(input.contatoId, actor.instanceId)
      : null;
    const targetDeal = input.dealId
      ? await dealsRepository.getById(input.dealId, actor.instanceId)
      : null;

    // Delegar para o MaiaRuntime desacoplado e reutilizável
    const result = await maiaRuntime.processTurn(
      {
        prompt: input.prompt,
        conversationId: input.conversationId || input.context?.conversationId,
        dealId: input.dealId,
        contatoId: input.contatoId,
        domainContext: {
          contato: targetContato,
          deal: targetDeal,
          planos
        },
        instance: {
          nomeFantasia: instance.nomeFantasia,
          razaoSocial: instance.razaoSocial,
          cidadeSede: instance.cidadeSede,
          uf: instance.uf,
          cnpj: instance.cnpj
        },
        context: input.context
      },
      actor
    );

    return {
      resposta: result.resposta,
      toolExecutada: result.toolExecutada,
      parametrosTool: result.parametrosTool,
      approvalId: result.approvalId,
      auditId: result.auditId,
      nivelAutonomia: result.nivelAutonomia,
      conversationId: result.conversationId,
      status: result.status,
      provider: result.provider,
      model: result.model
    };
  }
}

export const maiaService = new MaiaService();
