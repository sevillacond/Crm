import { dealsRepository, DealHistoryEntry } from './deals.repository.ts';
import { contatosRepository } from '../contatos/contatos.repository.ts';
import { planosRepository } from '../planos/planos.repository.ts';
import { Deal, DealEtapa } from '../../types/index.ts';
import { auditoriaService } from '../auditoria/auditoria.service.ts';
import { ActorContext } from '../auth/actorContext.ts';

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
  async listDeals(instanceId: string): Promise<Deal[]> {
    return dealsRepository.list(instanceId);
  }

  async getDealById(id: string, instanceId: string): Promise<Deal | null> {
    return dealsRepository.getById(id, instanceId);
  }

  async createDeal(
    input: CreateDealInput,
    actor: ActorContext
  ): Promise<Deal> {
    if (!actor || !actor.instanceId) {
      throw new Error('Acesso negado: Contexto de autorização ou instanceId ausente.');
    }

    // P0 PARTE 18: Integridade e isolamento estrito entre entidades
    // Validar se o contato existe e pertence estritamente à instância do ator
    const contato = await contatosRepository.getById(input.contatoId, actor.instanceId);
    if (!contato) {
      throw new Error(`Acesso negado: Contato ${input.contatoId} não encontrado ou pertence a outra instância.`);
    }

    // Validar se o plano existe e pertence estritamente à instância do ator
    const plano = await planosRepository.getById(input.planoId, actor.instanceId);
    if (!plano) {
      throw new Error(`Acesso negado: Plano ${input.planoId} não encontrado ou pertence a outra instância.`);
    }

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
      responsavelId: input.responsavelId || actor.userId,
      statusViabilidade: input.statusViabilidade || 'PENDENTE',
      notas: input.nota ? [input.nota] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await dealsRepository.create(novoDeal, actor.instanceId);

    await auditoriaService.logEvent({
      instanceId: actor.instanceId,
      actorId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'DEAL_CREATED',
      entityType: 'DEAL',
      entityId: saved.id,
      details: `Negócio "${saved.titulo}" criado no valor de R$ ${saved.valorMensal.toFixed(2)}/mês associado ao contato ${contato.nome}`,
      dadosPosteriores: saved
    });

    return saved;
  }

  async moveStage(
    id: string,
    targetStage: DealEtapa,
    actor: ActorContext,
    motivo?: string
  ): Promise<Deal> {
    const existing = await dealsRepository.getById(id, actor.instanceId);
    if (!existing) {
      throw new Error('Negócio não encontrado na instância');
    }

    const oldStage = existing.etapa;

    const updated = await dealsRepository.updateStage(
      id,
      targetStage,
      actor.instanceId,
      actor.userId,
      motivo
    );

    if (!updated) {
      throw new Error('Falha ao atualizar etapa do negócio');
    }

    await auditoriaService.logEvent({
      instanceId: actor.instanceId,
      actorId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'DEAL_STAGE_UPDATED',
      entityType: 'DEAL',
      entityId: id,
      details: `Negócio "${existing.titulo}" movido de [${oldStage}] para [${targetStage}].`,
      dadosAnteriores: { etapa: oldStage, probabilidade: existing.probabilidade },
      dadosPosteriores: { etapa: targetStage, motivo }
    });

    return updated;
  }

  async getDealHistory(dealId: string, instanceId: string): Promise<DealHistoryEntry[]> {
    return dealsRepository.getHistoryByDealId(dealId, instanceId);
  }
}

export const dealsService = new DealsService();
