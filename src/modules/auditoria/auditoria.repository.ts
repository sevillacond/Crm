import { db, isDbConnected } from '../../db/client.ts';
import { auditEventsTable, AuditEventDb } from '../../db/schema/auditEvents.ts';
import { desc, eq } from 'drizzle-orm';
import { INITIAL_AUDIT_LOGS } from '../../data/mockData.ts';
import { AuditLog, Role } from '../../types/index.ts';
import { env } from '../../config/env.ts';
import crypto from 'crypto';

export interface AuditEventInput {
  instanceId?: string;
  actorId: string;
  actorName: string;
  actorRole: Role | string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  correlationId?: string;
  dadosAnteriores?: any;
  dadosPosteriores?: any;
  origem?: string;
  resultado?: string;
  isMaiaAction?: boolean;
}

class AuditoriaRepository {
  private fallbackEvents: (AuditLog & { instanceId?: string; hashIntegridade?: string; previousHash?: string })[] =
    INITIAL_AUDIT_LOGS.map(l => ({
      ...l,
      instanceId: 'inst-enlace-fibra-001',
      hashIntegridade: 'GENESIS_inst-enlace-fibra-001_2026',
      previousHash: 'ROOT'
    }));

  async list(instanceId?: string, limit: number = 100): Promise<AuditLog[]> {
    if (!instanceId && env.NODE_ENV === 'production') {
      throw new Error('instanceId é estritamente obrigatório para consultar auditoria em produção.');
    }

    if (isDbConnected()) {
      try {
        const query = db.select().from(auditEventsTable);
        const condition = instanceId ? eq(auditEventsTable.instanceId, instanceId) : undefined;

        const rows = condition
          ? await query.where(condition).orderBy(desc(auditEventsTable.timestamp), desc(auditEventsTable.id)).limit(limit)
          : await query.orderBy(desc(auditEventsTable.timestamp), desc(auditEventsTable.id)).limit(limit);

        return rows.map(r => this.mapToDomain(r));
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao consultar auditoria em produção: ${err.message}`);
        }
        console.warn('[AuditoriaRepository] Falha ao consultar auditoria no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('PostgreSQL indisponível para consulta de auditoria em produção.');
    }

    const filtered = instanceId
      ? this.fallbackEvents.filter(e => e.instanceId === instanceId)
      : this.fallbackEvents;

    return [...filtered].slice(0, limit);
  }

  async save(input: AuditEventInput): Promise<AuditLog & { hashIntegridade: string; previousHash: string }> {
    const instanceId = input.instanceId || env.INSTANCE_ID;
    if (!instanceId && env.NODE_ENV === 'production') {
      throw new Error('Falha de auditoria: instanceId é estritamente obrigatório para registrar eventos de auditoria em produção.');
    }
    const finalInstanceId = instanceId || 'inst-dev-local-001';

    const id = `aud_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date();
    const timestampStr = timestamp.toISOString();

    // 1. Transactional & concurrency-safe chaining in PostgreSQL
    if (isDbConnected()) {
      try {
        const result = await db.transaction(async (tx) => {
          // Determinar previousHash da cadeia da instância dentro da transação segura
          const lastRow = await tx
            .select({ hashIntegridade: auditEventsTable.hashIntegridade })
            .from(auditEventsTable)
            .where(eq(auditEventsTable.instanceId, finalInstanceId))
            .orderBy(desc(auditEventsTable.timestamp), desc(auditEventsTable.id))
            .limit(1);

          const previousHash = lastRow.length > 0 && lastRow[0].hashIntegridade
            ? lastRow[0].hashIntegridade
            : `GENESIS_${finalInstanceId}_2026`;

          // Calcular hash criptográfico SHA-256
          const hashData = `${previousHash}|${id}|${finalInstanceId}|${timestampStr}|${input.actorId}|${input.action}|${input.entityType}|${input.entityId}|${input.details}`;
          const hashIntegridade = crypto.createHash('sha256').update(hashData).digest('hex');

          await tx.insert(auditEventsTable).values({
            id,
            instanceId: finalInstanceId,
            timestamp,
            actorId: input.actorId,
            actorName: input.actorName,
            actorRole: String(input.actorRole),
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId,
            details: input.details,
            ipAddress: input.ipAddress || null,
            userAgent: input.userAgent || null,
            requestId: input.requestId || null,
            correlationId: input.correlationId || null,
            dadosAnteriores: this.sanitizeData(input.dadosAnteriores),
            dadosPosteriores: this.sanitizeData(input.dadosPosteriores),
            origem: input.origem || 'WEB_CRM',
            resultado: input.resultado || 'SUCESSO',
            isMaiaAction: !!input.isMaiaAction,
            previousHash,
            hashIntegridade
          });

          return {
            id,
            timestamp: timestampStr,
            actorId: input.actorId,
            actorName: input.actorName,
            actorRole: input.actorRole as Role,
            action: input.action,
            entityType: input.entityType as any,
            entityId: input.entityId,
            details: input.details,
            isMaiaAction: !!input.isMaiaAction,
            hashIntegridade,
            previousHash
          };
        });

        return result;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha estrita de gravação de auditoria em produção: ${err.message}`);
        }
        console.warn('[AuditoriaRepository] Erro ao persistir evento no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Falha de integridade: Tentativa de registrar auditoria em memória em ambiente de produção.');
    }

    // Fallback apenas em dev/test: Encontrar o último hash da instância específica
    const instanceEvents = this.fallbackEvents.filter(e => e.instanceId === finalInstanceId);
    const previousHash = instanceEvents.length > 0 && instanceEvents[0].hashIntegridade
      ? instanceEvents[0].hashIntegridade
      : `GENESIS_${finalInstanceId}_2026`;

    const hashData = `${previousHash}|${id}|${finalInstanceId}|${timestampStr}|${input.actorId}|${input.action}|${input.entityType}|${input.entityId}|${input.details}`;
    const hashIntegridade = crypto.createHash('sha256').update(hashData).digest('hex');

    const savedEvent = {
      id,
      timestamp: timestampStr,
      actorId: input.actorId,
      actorName: input.actorName,
      actorRole: input.actorRole as Role,
      action: input.action,
      entityType: input.entityType as any,
      entityId: input.entityId,
      details: input.details,
      isMaiaAction: !!input.isMaiaAction,
      instanceId: finalInstanceId,
      hashIntegridade,
      previousHash
    };

    this.fallbackEvents.unshift(savedEvent);
    return savedEvent;
  }

  async create(input: AuditEventInput): Promise<AuditLog & { hashIntegridade: string; previousHash: string }> {
    return this.save(input);
  }

  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data || null;
    const sanitized = { ...data };
    const sensitiveKeys = ['password', 'passwordHash', 'token', 'jwt', 'secret', 'apiKey', 'tokenApi'];
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED_SENSITIVE]';
      }
    }
    return sanitized;
  }

  private mapToDomain(row: AuditEventDb): AuditLog {
    return {
      id: row.id,
      timestamp: row.timestamp ? row.timestamp.toISOString() : new Date().toISOString(),
      actorId: row.actorId,
      actorName: row.actorName,
      actorRole: row.actorRole as Role,
      action: row.action,
      entityType: row.entityType as any,
      entityId: row.entityId,
      details: row.details,
      isMaiaAction: row.isMaiaAction
    };
  }
}

export const auditoriaRepository = new AuditoriaRepository();
