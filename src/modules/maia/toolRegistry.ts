import { viabilidadeService } from '../viabilidade/viabilidade.service.ts';
import { planosService } from '../planos/planos.service.ts';
import { contatosRepository } from '../contatos/contatos.repository.ts';

export interface MaiaToolDefinition {
  name: string;
  description: string;
  nivelMinimoAutonomia: number; // 1 to 4
  requerAprovacaoHumana: boolean; // if level is 3, requires human confirmation
  execute: (params: any, actor: { id: string; name: string; role: any }) => Promise<any>;
}

export const MAIA_TOOL_REGISTRY: Record<string, MaiaToolDefinition> = {
  consultar_viabilidade: {
    name: 'consultar_viabilidade',
    description: 'Consulta viabilidade técnica da rede FTTH GPON (modo simulado demo com disclaimer)',
    nivelMinimoAutonomia: 1,
    requerAprovacaoHumana: false,
    execute: async (params, actor) => {
      return viabilidadeService.consultar(
        {
          cep: params.cep || '13024-000',
          numero: params.numero || '100',
          bairro: params.bairro
        },
        params.contatoId,
        { ...actor, isMaia: true }
      );
    }
  },

  recomendar_plano: {
    name: 'recomendar_plano',
    description: 'Analisa o catálogo de planos da operadora e sugere a melhor opção custo-benefício',
    nivelMinimoAutonomia: 1,
    requerAprovacaoHumana: false,
    execute: async () => {
      const planos = await planosService.getAll();
      const planoIdeal = planos.find(p => p.popular) || planos[0];
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
    description: 'Calcula o score de propensão de fechamento e temperatura do lead',
    nivelMinimoAutonomia: 2,
    requerAprovacaoHumana: false,
    execute: async (params) => {
      const score = 92;
      const resumo = 'Lead com alta propensão de fechamento e interesse imediato em portabilidade.';
      if (params.contatoId) {
        await contatosRepository.update(params.contatoId, {
          scoreMaia: score,
          resumoMaia: resumo
        });
      }
      return {
        score,
        temperatura: 'QUENTE',
        resumo
      };
    }
  }
};
