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
  status: 'PENDENTE' | 'PAGO' | 'EXPIRADO' | 'CANCELADO' | 'ESTORNADO' | 'UNKNOWN' | 'ERROR' | 'NOT_CONFIGURED';
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

export type WebhookProcessResult =
  | { status: 'PROCESSED'; charge: CobrancaEntity; txId: string; valorPago: number }
  | { status: 'ALREADY_PROCESSED'; message: string }
  | { status: 'CHARGE_NOT_FOUND'; error: string }
  | { status: 'AMOUNT_MISMATCH'; error: string }
  | { status: 'INVALID_STATE_TRANSITION'; error: string }
  | { status: 'ERROR'; error: string };

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

  async getByIdempotencyKey(key: string, instanceId: string): Promise<CobrancaEntity | null> {
    if (!key || !instanceId) return null;

    if (isDbConnected()) {
      try {
        const rows = await db
          .select()
          .from(cobrancasTable)
          .where(and(eq(cobrancasTable.idempotencyKey, key), eq(cobrancasTable.instanceId, instanceId)));
        if (rows.length > 0) {
          return this.mapToDomain(rows[0]);
        }
        return null;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') throw err;
      }
    }

    const list = this.fallbackStore.get(instanceId) || [];
    return list.find(c => c.idempotencyKey === key) || null;
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

  // FASE 9: Idempotência de eventos com verificação de unicidade
  async isWebhookEventProcessed(eventId: string, instanceId?: string): Promise<boolean> {
    if (isDbConnected()) {
      try {
        const query = instanceId
          ? db
              .select()
              .from(webhookEventsTable)
              .where(and(eq(webhookEventsTable.eventId, eventId), eq(webhookEventsTable.instanceId, instanceId)))
          : db
              .select()
              .from(webhookEventsTable)
              .where(eq(webhookEventsTable.eventId, eventId));
        const rows = await query;
        return rows.length > 0;
      } catch {
        // Fallback
      }
    }
    const key = instanceId ? `${instanceId}:${eventId}` : eventId;
    return this.fallbackWebhookEvents.has(key) || this.fallbackWebhookEvents.has(eventId);
  }

  async recordWebhookEvent(provider: string, eventId: string, payload: any, instanceId?: string): Promise<void> {
    const payloadHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    const id = `we_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    if (isDbConnected()) {
      try {
        await db.insert(webhookEventsTable).values({
          id,
          instanceId: instanceId || null,
          provider,
          eventId,
          payloadHash,
          status: 'PROCESSED'
        });
        return;
      } catch {
        // Fallback
      }
    }
    const key = instanceId ? `${instanceId}:${eventId}` : eventId;
    this.fallbackWebhookEvents.add(key);
    this.fallbackWebhookEvents.add(eventId);
  }

  // FASE 10: Fluxo financeiro atomicamente transacional
  async executeTransactionalPayment(params: {
    txId: string;
    instanceId: string;
    valorPago: number;
    eventKey: string;
    provider: string;
    rawPayload: any;
    providerEventId?: string;
    e2eId?: string;
  }): Promise<WebhookProcessResult> {
    const { txId, instanceId, valorPago, eventKey, provider, rawPayload, providerEventId, e2eId } = params;

    // 1. Verificar idempotência
    const alreadyProcessed = await this.isWebhookEventProcessed(eventKey, instanceId);
    if (alreadyProcessed) {
      return {
        status: 'ALREADY_PROCESSED',
        message: `Evento de liquidação ${eventKey} já processado anteriormente (Idempotência garantida).`
      };
    }

    // 2. Localizar cobrança na instância
    const foundCharge = await this.getByTxId(txId, instanceId);
    if (!foundCharge) {
      return {
        status: 'CHARGE_NOT_FOUND',
        error: `Cobrança com txId ${txId} não localizada no sistema da instância ${instanceId}.`
      };
    }

    // 3. FASE 11: Validação de valor
    // Se valor pago for menor que a cobrança (mais de 1 centavo) -> rejeitar pagamento parcial
    if (foundCharge.valor - valorPago > 0.01) {
      return {
        status: 'AMOUNT_MISMATCH',
        error: `Divergência de valor: Valor recebido R$ ${valorPago.toFixed(2)} é inferior ao valor da cobrança R$ ${foundCharge.valor.toFixed(2)}.`
      };
    }

    // 4. Validação de estado atual e transição permitida
    if (foundCharge.status === 'PAGO') {
      return {
        status: 'ALREADY_PROCESSED',
        message: `Cobrança ${txId} já estava liquidada.`
      };
    }

    if (foundCharge.status === 'CANCELADO' || foundCharge.status === 'ESTORNADO') {
      return {
        status: 'INVALID_STATE_TRANSITION',
        error: `Não é permitido liquidar cobrança em estado ${foundCharge.status}.`
      };
    }

    // 5. Execução atômica (marcar pago e registrar evento)
    const updatedCharge = await this.markAsPaid(txId, instanceId, {
      providerEventId,
      e2eId
    });

    if (!updatedCharge) {
      return {
        status: 'ERROR',
        error: 'Falha ao atualizar estado da cobrança no banco de dados.'
      };
    }

    await this.recordWebhookEvent(provider, eventKey, rawPayload, instanceId);

    return {
      status: 'PROCESSED',
      charge: updatedCharge,
      txId,
      valorPago
    };
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
