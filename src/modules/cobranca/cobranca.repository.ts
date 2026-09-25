import { db, isDbConnected } from '../../db/client.ts';
import { cobrancasTable, webhookEventsTable, CobrancaDb } from '../../db/schema/cobrancas.ts';
import { eq, and } from 'drizzle-orm';
import { env } from '../../config/env.ts';
import crypto from 'crypto';

export interface CobrancaEntity {
  id: string;
  instanceId: string;
  txid: string;
  contatoId?: string;
  dealId?: string;
  faturaId: string;
  valor: number;
  status: 'PENDENTE' | 'PAGO' | 'EXPIRADO' | 'CANCELADO' | 'ESTORNADO';
  pixCopiaECola?: string;
  chavePix?: string;
  provider: string;
  providerEventId?: string;
  e2eId?: string;
  idempotencyKey?: string;
  pagoEm?: Date;
  createdAt: Date;
  updatedAt: Date;
}

class CobrancaRepository {
  private fallbackStore: Map<string, CobrancaEntity[]> = new Map();
  private fallbackWebhookEvents: Set<string> = new Set();

  async create(data: Omit<CobrancaEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<CobrancaEntity> {
    const id = `cob_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const entity: CobrancaEntity = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isDbConnected()) {
      try {
        await db.insert(cobrancasTable).values({
          id: entity.id,
          instanceId: entity.instanceId,
          txid: entity.txid,
          contatoId: entity.contatoId,
          dealId: entity.dealId,
          faturaId: entity.faturaId,
          valor: entity.valor.toString(),
          status: entity.status,
          pixCopiaECola: entity.pixCopiaECola,
          chavePix: entity.chavePix,
          provider: entity.provider,
          providerEventId: entity.providerEventId,
          e2eId: entity.e2eId,
          idempotencyKey: entity.idempotencyKey
        });
        return entity;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha ao persistir cobrança em produção: ${err.message}`);
        }
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação financeira bloqueada em produção.');
    }

    const list = this.fallbackStore.get(data.instanceId) || [];
    list.push(entity);
    this.fallbackStore.set(data.instanceId, list);
    return entity;
  }

  async getByTxId(txid: string, instanceId: string): Promise<CobrancaEntity | null> {
    if (!instanceId && env.NODE_ENV === 'production') {
      throw new Error('instanceId é obrigatório para consultar cobrança em produção.');
    }

    if (isDbConnected()) {
      try {
        const rows = await db
          .select()
          .from(cobrancasTable)
          .where(and(eq(cobrancasTable.txid, txid), eq(cobrancasTable.instanceId, instanceId)));
        if (rows.length > 0) {
          return this.mapToDomain(rows[0]);
        }
        return null;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') throw err;
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível em produção.');
    }

    const list = this.fallbackStore.get(instanceId) || [];
    return list.find(c => c.txid === txid) || null;
  }

  async getAllByInstance(instanceId: string): Promise<CobrancaEntity[]> {
    if (isDbConnected()) {
      try {
        const rows = await db
          .select()
          .from(cobrancasTable)
          .where(eq(cobrancasTable.instanceId, instanceId));
        return rows.map(r => this.mapToDomain(r));
      } catch (err: any) {
        if (env.NODE_ENV === 'production') throw err;
      }
    }
    return this.fallbackStore.get(instanceId) || [];
  }

  async markAsPaid(
    txid: string,
    instanceId: string,
    details: { providerEventId?: string; e2eId?: string }
  ): Promise<CobrancaEntity | null> {
    const pagoEm = new Date();
    if (isDbConnected()) {
      try {
        const [updated] = await db
          .update(cobrancasTable)
          .set({
            status: 'PAGO',
            pagoEm,
            providerEventId: details.providerEventId,
            e2eId: details.e2eId,
            updatedAt: pagoEm
          })
          .where(and(eq(cobrancasTable.txid, txid), eq(cobrancasTable.instanceId, instanceId)))
          .returning();
        if (updated) return this.mapToDomain(updated);
      } catch (err: any) {
        if (env.NODE_ENV === 'production') throw err;
      }
    }

    const list = this.fallbackStore.get(instanceId) || [];
    const item = list.find(c => c.txid === txid);
    if (item) {
      item.status = 'PAGO';
      item.pagoEm = pagoEm;
      item.providerEventId = details.providerEventId;
      item.e2eId = details.e2eId;
      item.updatedAt = pagoEm;
      return item;
    }
    return null;
  }

  // Idempotência: verifica se o evento já foi processado
  async isWebhookEventProcessed(eventId: string): Promise<boolean> {
    if (isDbConnected()) {
      try {
        const rows = await db
          .select()
          .from(webhookEventsTable)
          .where(eq(webhookEventsTable.eventId, eventId));
        return rows.length > 0;
      } catch {
        // fallback
      }
    }
    return this.fallbackWebhookEvents.has(eventId);
  }

  async recordWebhookEvent(provider: string, eventId: string, payload: any): Promise<void> {
    const payloadHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    const id = `we_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    if (isDbConnected()) {
      try {
        await db.insert(webhookEventsTable).values({
          id,
          provider,
          eventId,
          payloadHash,
          status: 'PROCESSED'
        });
        return;
      } catch {
        // fallback
      }
    }
    this.fallbackWebhookEvents.add(eventId);
  }

  private mapToDomain(row: CobrancaDb): CobrancaEntity {
    return {
      id: row.id,
      instanceId: row.instanceId,
      txid: row.txid || '',
      contatoId: row.contatoId || undefined,
      dealId: row.dealId || undefined,
      faturaId: row.faturaId,
      valor: Number(row.valor),
      status: row.status as any,
      pixCopiaECola: row.pixCopiaECola || undefined,
      chavePix: row.chavePix || undefined,
      provider: row.provider,
      providerEventId: row.providerEventId || undefined,
      e2eId: row.e2eId || undefined,
      idempotencyKey: row.idempotencyKey || undefined,
      pagoEm: row.pagoEm || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }
}

export const cobrancaRepository = new CobrancaRepository();
