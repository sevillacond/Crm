import { ViabilidadeQuery, ViabilidadeResult, IViabilidadeAdapter } from './viabilidade.interface.ts';
import { auditoriaService } from '../auditoria/auditoria.service.ts';
import { contatosRepository } from '../contatos/contatos.repository.ts';
import { dealsRepository } from '../deals/deals.repository.ts';

class DemoViabilidadeAdapter implements IViabilidadeAdapter {
  async consultar(query: ViabilidadeQuery): Promise<ViabilidadeResult> {
    const cleanCep = (query.cep || '').replace(/\D/g, '');
    const cleanNum = (query.numero || '1').replace(/\D/g, '');

    // Deterministic simulation hash for sandbox demonstration
    const hash = (cleanCep + cleanNum).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const isViavel = hash % 5 !== 0; // 80% viavel
    const dist = isViavel ? 20 + (hash % 85) : 340;
    const ctoId = isViavel ? `CTO-DEMO-${(query.bairro || 'CAM').substring(0, 3).toUpperCase()}-${String(hash % 99).padStart(3, '0')}` : undefined;
    const portas = isViavel ? 2 + (hash % 10) : 0;

    return {
      modoExecucao: 'MOCK_DEMO_SIMULADO',
      isEstimativaHeuristica: true,
      avisoLegal: '[SIMULAÇÃO MOCK/DEMO] Resultado estimado para demonstração de fluxo. Não representa garantia técnica de cobertura até integração com GIS/CTO da operadora.',
      cep: query.cep,
      numero: query.numero,
      bairro: query.bairro || 'Centro',
      viavel: isViavel,
      ctoId,
      distanciaMetros: dist,
      portasLivres: portas,
      tecnologiaDisponivel: isViavel ? 'FTTH GPON (Estimativa Demo)' : 'Sem viabilidade óptica imediata (Demo)',
      observacao: isViavel
        ? `[ESTIMATIVA DEMO] CTO ${ctoId} a aproximadamente ${dist}m de distância estimada.`
        : '[ESTIMATIVA DEMO] Sem viabilidade imediata. Requer vistoria técnica de campo.'
    };
  }
}

class ViabilidadeService {
  private adapter: IViabilidadeAdapter = new DemoViabilidadeAdapter();

  setAdapter(adapter: IViabilidadeAdapter) {
    this.adapter = adapter;
  }

  async consultar(
    query: ViabilidadeQuery,
    contatoId?: string,
    actor?: { id: string; name: string; role: any; isMaia?: boolean }
  ): Promise<ViabilidadeResult> {
    const result = await this.adapter.consultar(query);

    // If associated with a contact or deal, reflect feasibility state
    if (contatoId) {
      const contato = await contatosRepository.getById(contatoId);
      if (contato) {
        await contatosRepository.update(contatoId, {
          status: result.viavel ? 'VIAVEL' : 'INVIAVEL'
        });
      }
    }

    if (actor) {
      await auditoriaService.logEvent({
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
