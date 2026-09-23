import {
  IViabilidadeAdapter,
  ViabilidadeQuery,
  ViabilidadeResult
} from './viabilidade.interface.ts';
import { contatosRepository } from '../contatos/contatos.repository.ts';
import { auditoriaService } from '../auditoria/auditoria.service.ts';

export class ViabilidadeSimuladaAdapter implements IViabilidadeAdapter {
  async consultar(query: ViabilidadeQuery): Promise<ViabilidadeResult> {
    const num = parseInt(query.numero.replace(/\D/g, '') || '0', 10);
    const isEven = num % 2 === 0;

    return {
      modoExecucao: 'MOCK_DEMO_SIMULADO',
      isEstimativaHeuristica: true,
      avisoLegal: '[AVISO DE GOVERNANÇA] Modo estimativa simulada sandbox para demonstração técnica.',
      cep: query.cep,
      numero: query.numero,
      bairro: query.bairro || 'Bairro Central',
      viavel: isEven,
      ctoId: isEven ? 'CTO-CAMP-04' : undefined,
      distanciaMetros: isEven ? 55 : undefined,
      portasLivres: isEven ? 4 : 0,
      tecnologiaDisponivel: 'FTTH GPON 2.5 Gbps',
      observacao: isEven
        ? 'Viabilidade técnica positiva com CTO a 55 metros.'
        : 'Inviável no momento por esgotamento de portas na caixa de atendimento.'
    };
  }
}

class ViabilidadeService {
  private adapter: IViabilidadeAdapter;

  constructor() {
    this.adapter = new ViabilidadeSimuladaAdapter();
  }

  setAdapter(adapter: IViabilidadeAdapter) {
    this.adapter = adapter;
  }

  async consultar(
    query: ViabilidadeQuery,
    contatoId?: string,
    actor?: { id: string; name: string; role: any; instanceId?: string; isMaia?: boolean }
  ): Promise<ViabilidadeResult> {
    const result = await this.adapter.consultar(query);

    // If associated with a contact or deal, reflect feasibility state
    if (contatoId && actor?.instanceId) {
      const contato = await contatosRepository.getById(contatoId, actor.instanceId);
      if (contato) {
        await contatosRepository.update(
          contatoId,
          {
            status: result.viavel ? 'VIAVEL' : 'INVIAVEL'
          },
          actor.instanceId
        );
      }
    }

    if (actor) {
      await auditoriaService.logEvent({
        instanceId: actor.instanceId,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: actor.isMaia ? 'MAIA_TOOL_VIABILIDADE_EXECUTED' : 'VIABILIDADE_CONSULTADA',
        entityType: 'VIABILIDADE',
        entityId: result.ctoId || 'GEO_SIMULACAO',
        details: `Consulta de viabilidade CEP ${query.cep}, nº ${query.numero} [Modo: ${result.modoExecucao}]. Resultado: ${result.viavel ? 'VIÁVEL' : 'INVIÁVEL'} (Distância: ${result.distanciaMetros}m).`,
        dadosPosteriores: result,
        isMaiaAction: !!actor.isMaia
      });
    }

    return result;
  }
}

export const viabilidadeService = new ViabilidadeService();
