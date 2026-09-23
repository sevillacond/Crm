import { dealsRepository, DealHistoryEntry } from './deals.repository.ts';
import { Deal, DealEtapa } from '../../types/index.ts';
import { auditoriaService } from '../auditoria/auditoria.service.ts';

export interface CreateDealInput {
  titulo: string;
  contatoId: string;
  planoId: string;
  etapa?: DealEtapa;
  valorMensal: number;
  taxaAdesao?: number;
  probabilidade?: number;
  dataPrevisao?: string;
  responsavelId?: string;
  statusViabilidade?: any;
  nota?: string;
}

const STAGE_PROBABILITIES: Record<DealEtapa, number> = {
  NOVO_LEAD: 20,
  VIABILIDADE: 40,
  PROPOSTA: 60,
  NEGOCIACAO: 80,
  INSTALACAO: 95,
  GANHO: 100,
  PERDIDO: 0
};

class DealsService {
  async listDeals(): Promise<Deal[]> {
    return dealsRepository.getAll();
  }

  async getDealById(id: string): Promise<Deal | null> {
    return dealsRepository.getById(id);
  }

  async createDeal(
    input: CreateDealInput,
    actor: { id: string; name: string; role: any }
  ): Promise<Deal> {
    const newId = `dl_${Date.now().toString().slice(-6)}`;
    const etapa = input.etapa || 'NOVO_LEAD';
    const probabilidade = input.probabilidade !== undefined
      ? input.probabilidade
      : (STAGE_PROBABILITIES[etapa] ?? 20);

    const novoDeal: Deal = {
      id: newId,
      titulo: input.titulo.trim(),
      contatoId: input.contatoId,
      planoId: input.planoId,
      etapa,
      valorMensal: Number(input.valorMensal) || 0,
      taxaAdesao: Number(input.taxaAdesao) || 0,
      probabilidade,
      dataPrevisao: input.dataPrevisao || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      responsavelId: input.responsavelId || actor.id,
      statusViabilidade: input.statusViabilidade || 'PENDENTE',
      notas: input.nota ? [input.nota] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await dealsRepository.create(novoDeal);

    await auditoriaService.logEvent({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'DEAL_CREATED',
      entityType: 'DEAL',
      entityId: saved.id,
      details: `Negócio "${saved.titulo}" criado no valor de R$ ${saved.valorMensal.toFixed(2)}/mês`,
      dadosPosteriores: saved
    });

    return saved;
  }

  async moveStage(
    id: string,
    targetStage: DealEtapa,
    actor: { id: string; name: string; role: any },
    motivo?: string
  ): Promise<Deal> {
    const existing = await dealsRepository.getById(id);
    if (!existing) {
      throw new Error('Negócio não encontrado');
    }

    const oldStage = existing.etapa;
    const probabilidade = STAGE_PROBABILITIES[targetStage] ?? existing.probabilidade;

    const updated = await dealsRepository.updateStage(
      id,
      targetStage,
      probabilidade,
      actor.id,
      motivo
    );

    if (!updated) {
      throw new Error('Falha ao atualizar etapa do negócio');
    }

    await auditoriaService.logEvent({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'DEAL_STAGE_UPDATED',
      entityType: 'DEAL',
      entityId: id,
      details: `Negócio "${existing.titulo}" movido de [${oldStage}] para [${targetStage}]. Probabilidade ajustada para ${probabilidade}%.`,
      dadosAnteriores: { etapa: oldStage, probabilidade: existing.probabilidade },
      dadosPosteriores: { etapa: targetStage, probabilidade, motivo }
    });

    return updated;
  }

  async getDealHistory(dealId: string): Promise<DealHistoryEntry[]> {
    return dealsRepository.getHistoryByDealId(dealId);
  }
}

export const dealsService = new DealsService();
