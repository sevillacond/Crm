import { db, isDbConnected } from '../../db/client.ts';
import { dealsTable, DealDb } from '../../db/schema/deals.ts';
import { dealHistoryTable, DealHistoryDb } from '../../db/schema/dealHistory.ts';
import { eq, isNull, and, desc } from 'drizzle-orm';
import { INITIAL_DEALS } from '../../data/mockData.ts';
import { Deal, DealEtapa, ViabilidadeStatus } from '../../types/index.ts';

export interface DealHistoryEntry {
  id: string;
  dealId: string;
  etapaAnterior: string;
  etapaNova: string;
  motivo?: string;
  userId: string;
  createdAt: string;
}

class DealsRepository {
  private fallbackDeals: Deal[] = [...INITIAL_DEALS];
  private fallbackHistory: DealHistoryEntry[] = [];

  async getAll(): Promise<Deal[]> {
    if (isDbConnected()) {
      try {
        const rows = await db
          .select()
          .from(dealsTable)
          .where(isNull(dealsTable.deletedAt))
          .orderBy(desc(dealsTable.updatedAt));

        if (rows.length > 0) {
          return rows.map(r => this.mapToDomain(r));
        }
      } catch (err: any) {
        console.warn('[DealsRepository] Erro ao consultar deals no Postgres:', err.message);
      }
    }
    return this.fallbackDeals.filter(d => !((d as any).deletedAt));
  }

  async getById(id: string): Promise<Deal | null> {
    if (isDbConnected()) {
      try {
        const rows = await db
          .select()
          .from(dealsTable)
          .where(and(eq(dealsTable.id, id), isNull(dealsTable.deletedAt)))
          .limit(1);

        if (rows.length > 0) {
          return this.mapToDomain(rows[0]);
        }
      } catch (err: any) {
        console.warn('[DealsRepository] Erro ao buscar deal por ID no Postgres:', err.message);
      }
    }
    const found = this.fallbackDeals.find(d => d.id === id && !((d as any).deletedAt));
    return found || null;
  }

  async create(deal: Deal): Promise<Deal> {
    this.fallbackDeals.unshift(deal);

    if (isDbConnected()) {
      try {
        await db.insert(dealsTable).values({
          id: deal.id,
          instanceId: 'inst_enlace_sp_001',
          titulo: deal.titulo,
          contatoId: deal.contatoId,
          planoId: deal.planoId,
          etapa: deal.etapa,
          valorMensal: String(deal.valorMensal),
          taxaAdesao: String(deal.taxaAdesao),
          probabilidade: deal.probabilidade,
          dataPrevisao: deal.dataPrevisao,
          responsavelId: deal.responsavelId,
          statusViabilidade: deal.statusViabilidade,
          ctoProxima: deal.ctoProxima,
          distanciaMetros: deal.distanciaMetros,
          motivoPerda: deal.motivoPerda,
          notas: deal.notas,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } catch (err: any) {
        console.warn('[DealsRepository] Erro ao persistir deal no Postgres:', err.message);
      }
    }

    return deal;
  }

  async updateStage(
    id: string,
    novaEtapa: DealEtapa,
    probabilidade: number,
    userId: string,
    motivo?: string
  ): Promise<Deal | null> {
    const deal = await this.getById(id);
    if (!deal) return null;

    const etapaAnterior = deal.etapa;
    const updatedAt = new Date().toISOString();

    // 1. Update in-memory fallback
    const idx = this.fallbackDeals.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.fallbackDeals[idx] = {
        ...this.fallbackDeals[idx],
        etapa: novaEtapa,
        probabilidade,
        updatedAt
      };
    }

    // 2. Record History
    const historyId = `dlh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const historyEntry: DealHistoryEntry = {
      id: historyId,
      dealId: id,
      etapaAnterior,
      etapaNova: novaEtapa,
      motivo,
      userId,
      createdAt: updatedAt
    };
    this.fallbackHistory.unshift(historyEntry);

    // 3. Persist to Postgres in transaction
    if (isDbConnected()) {
      try {
        await db.transaction(async (tx) => {
          await tx
            .update(dealsTable)
            .set({
              etapa: novaEtapa,
              probabilidade,
              updatedAt: new Date()
            })
            .where(eq(dealsTable.id, id));

          await tx.insert(dealHistoryTable).values({
            id: historyId,
            dealId: id,
            etapaAnterior,
            etapaNova: novaEtapa,
            motivo: motivo || null,
            userId,
            createdAt: new Date()
          });
        });
      } catch (err: any) {
        console.warn('[DealsRepository] Erro ao atualizar etapa e histórico no Postgres:', err.message);
      }
    }

    return this.getById(id);
  }

  async getHistoryByDealId(dealId: string): Promise<DealHistoryEntry[]> {
    if (isDbConnected()) {
      try {
        const rows = await db
          .select()
          .from(dealHistoryTable)
          .where(eq(dealHistoryTable.dealId, dealId))
          .orderBy(desc(dealHistoryTable.createdAt));

        if (rows.length > 0) {
          return rows.map(r => ({
            id: r.id,
            dealId: r.dealId,
            etapaAnterior: r.etapaAnterior,
            etapaNova: r.etapaNova,
            motivo: r.motivo || undefined,
            userId: r.userId,
            createdAt: r.createdAt.toISOString()
          }));
        }
      } catch (err: any) {
        console.warn('[DealsRepository] Erro ao obter histórico do deal no Postgres:', err.message);
      }
    }
    return this.fallbackHistory.filter(h => h.dealId === dealId);
  }

  private mapToDomain(row: DealDb): Deal {
    return {
      id: row.id,
      titulo: row.titulo,
      contatoId: row.contatoId,
      planoId: row.planoId,
      etapa: row.etapa as DealEtapa,
      valorMensal: Number(row.valorMensal),
      taxaAdesao: Number(row.taxaAdesao),
      probabilidade: row.probabilidade,
      dataPrevisao: row.dataPrevisao,
      responsavelId: row.responsavelId,
      statusViabilidade: row.statusViabilidade as ViabilidadeStatus,
      ctoProxima: row.ctoProxima || undefined,
      distanciaMetros: row.distanciaMetros || undefined,
      motivoPerda: row.motivoPerda || undefined,
      notas: (row.notas as string[]) || [],
      createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : new Date().toISOString()
    };
  }
}

export const dealsRepository = new DealsRepository();
