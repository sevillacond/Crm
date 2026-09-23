import { db, isDbConnected } from '../../db/client.ts';
import { dealsTable, DealDb } from '../../db/schema/deals.ts';
import { dealHistoryTable, DealHistoryDb } from '../../db/schema/dealHistory.ts';
import { eq, isNull, and, desc } from 'drizzle-orm';
import { INITIAL_DEALS } from '../../data/mockData.ts';
import { Deal, DealEtapa, ViabilidadeStatus } from '../../types/index.ts';
import { env } from '../../config/env.ts';
import crypto from 'crypto';

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
  private fallbackDeals: (Deal & { instanceId?: string })[] = INITIAL_DEALS.map(d => ({
    ...d,
    instanceId: 'inst-enlace-fibra-001'
  }));
  private fallbackHistory: DealHistoryEntry[] = [];

  async getAll(instanceId?: string): Promise<Deal[]> {
    if (isDbConnected()) {
      try {
        const conditions = [isNull(dealsTable.deletedAt)];
        if (instanceId) {
          conditions.push(eq(dealsTable.instanceId, instanceId));
        }

        const rows = await db
          .select()
          .from(dealsTable)
          .where(and(...conditions))
          .orderBy(desc(dealsTable.updatedAt));

        return rows.map(r => this.mapToDomain(r));
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao buscar deals em produção: ${err.message}`);
        }
        console.warn('[DealsRepository] Erro ao consultar deals no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação interrompida em produção.');
    }

    return this.fallbackDeals
      .filter(d => (!instanceId || d.instanceId === instanceId) && !((d as any).deletedAt));
  }

  async getById(id: string, instanceId?: string): Promise<Deal | null> {
    if (isDbConnected()) {
      try {
        const conditions = [eq(dealsTable.id, id), isNull(dealsTable.deletedAt)];
        if (instanceId) {
          conditions.push(eq(dealsTable.instanceId, instanceId));
        }

        const rows = await db
          .select()
          .from(dealsTable)
          .where(and(...conditions))
          .limit(1);

        if (rows.length > 0) {
          return this.mapToDomain(rows[0]);
        }
        return null;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao buscar deal por ID em produção: ${err.message}`);
        }
        console.warn('[DealsRepository] Erro ao buscar deal por ID no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação interrompida em produção.');
    }

    const found = this.fallbackDeals.find(
      d => d.id === id && (!instanceId || d.instanceId === instanceId) && !((d as any).deletedAt)
    );
    return found || null;
  }

  async create(deal: Deal, instanceId?: string): Promise<Deal> {
    const finalInstanceId = instanceId || (deal as any).instanceId || env.INSTANCE_ID || 'inst-enlace-fibra-001';

    if (isDbConnected()) {
      try {
        await db.insert(dealsTable).values({
          id: deal.id,
          instanceId: finalInstanceId,
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
        return deal;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao persistir deal em produção: ${err.message}`);
        }
        console.warn('[DealsRepository] Erro ao persistir deal no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Impossível salvar deal em produção.');
    }

    this.fallbackDeals.unshift({ ...deal, instanceId: finalInstanceId });
    return deal;
  }

  async updateStage(
    id: string,
    novaEtapa: DealEtapa,
    probabilidade: number,
    userId: string,
    instanceId?: string,
    motivo?: string
  ): Promise<Deal | null> {
    const deal = await this.getById(id, instanceId);
    if (!deal) return null;

    const etapaAnterior = deal.etapa;
    const updatedAt = new Date();
    const historyId = `dlh_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    if (isDbConnected()) {
      try {
        await db.transaction(async (tx) => {
          const conditions = [eq(dealsTable.id, id)];
          if (instanceId) {
            conditions.push(eq(dealsTable.instanceId, instanceId));
          }

          await tx
            .update(dealsTable)
            .set({
              etapa: novaEtapa,
              probabilidade,
              updatedAt
            })
            .where(and(...conditions));

          await tx.insert(dealHistoryTable).values({
            id: historyId,
            dealId: id,
            etapaAnterior,
            etapaNova: novaEtapa,
            motivo: motivo || null,
            userId,
            createdAt: updatedAt
          });
        });

        return this.getById(id, instanceId);
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao transicionar etapa no Postgres em produção: ${err.message}`);
        }
        console.warn('[DealsRepository] Erro ao atualizar etapa e histórico no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação interrompida em produção.');
    }

    // Fallback in dev/test only
    const idx = this.fallbackDeals.findIndex(d => d.id === id && (!instanceId || d.instanceId === instanceId));
    if (idx !== -1) {
      this.fallbackDeals[idx] = {
        ...this.fallbackDeals[idx],
        etapa: novaEtapa,
        probabilidade,
        updatedAt: updatedAt.toISOString()
      };
    }

    this.fallbackHistory.unshift({
      id: historyId,
      dealId: id,
      etapaAnterior,
      etapaNova: novaEtapa,
      motivo,
      userId,
      createdAt: updatedAt.toISOString()
    });

    return this.getById(id, instanceId);
  }

  async getHistoryByDealId(dealId: string): Promise<DealHistoryEntry[]> {
    if (isDbConnected()) {
      try {
        const rows = await db
          .select()
          .from(dealHistoryTable)
          .where(eq(dealHistoryTable.dealId, dealId))
          .orderBy(desc(dealHistoryTable.createdAt));

        return rows.map(r => ({
          id: r.id,
          dealId: r.dealId,
          etapaAnterior: r.etapaAnterior,
          etapaNova: r.etapaNova,
          motivo: r.motivo || undefined,
          userId: r.userId,
          createdAt: r.createdAt.toISOString()
        }));
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao consultar histórico de deal em produção: ${err.message}`);
        }
        console.warn('[DealsRepository] Erro ao buscar histórico no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação interrompida em produção.');
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
      probabilidade: row.probabilidade || 50,
      dataPrevisao: row.dataPrevisao || new Date().toISOString().split('T')[0],
      responsavelId: row.responsavelId || 'usr_admin',
      statusViabilidade: (row.statusViabilidade as ViabilidadeStatus) || 'PENDENTE',
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
