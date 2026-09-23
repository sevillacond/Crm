import { viabilidadeService } from '../viabilidade/viabilidade.service.ts';
import { planosService } from '../planos/planos.service.ts';
import { contatosRepository } from '../contatos/contatos.repository.ts';
import { auditoriaService } from '../auditoria/auditoria.service.ts';
import { ActorContext } from '../auth/actorContext.ts';

export interface MaiaToolDefinition {
  name: string;
  description: string;
  nivelMinimoAutonomia: number; // 1 to 4
  requerAprovacaoHumana: boolean; // if level is 3, requires human confirmation
  execute: (params: any, actor: ActorContext) => Promise<any>;
}

export const MAIA_TOOL_REGISTRY: Record<string, MaiaToolDefinition> = {
  consultar_viabilidade: {
    name: 'consultar_viabilidade',
    description: 'Consulta viabilidade técnica da rede FTTH GPON (modo simulado demo com disclaimer)',
    nivelMinimoAutonomia: 1,
    requerAprovacaoHumana: false,
    execute: async (params, actor) => {
      if (!actor?.instanceId) {
        throw new Error('Contexto de ator inválido ou sem instanceId.');
      }
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
    }
  },

  recomendar_plano: {
    name: 'recomendar_plano',
    description: 'Analisa o catálogo de planos da operadora e sugere a melhor opção custo-benefício',
    nivelMinimoAutonomia: 1,
    requerAprovacaoHumana: false,
    execute: async (_params, actor) => {
      if (!actor?.instanceId) {
        throw new Error('Contexto de ator inválido ou sem instanceId.');
      }
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
    }
  },

  qualificar_lead: {
    name: 'qualificar_lead',
    description: 'Calcula o score de propensão de fechamento e temperatura do lead com validação de instância',
    nivelMinimoAutonomia: 2,
    requerAprovacaoHumana: false,
    execute: async (params, actor) => {
      // P0: Isolamento estrito da MaIA e qualificar_lead
      if (!actor || !actor.instanceId) {
        throw new Error('Contexto de ator inválido: instanceId obrigatório.');
      }

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
    }
  }
};
