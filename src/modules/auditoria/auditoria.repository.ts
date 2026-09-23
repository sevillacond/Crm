import { db, isDbConnected } from '../../db/client.ts';
import { auditEventsTable, AuditEventDb } from '../../db/schema/auditEvents.ts';
import { desc, eq, and } from 'drizzle-orm';
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
    INITIAL_AUDIT_LOGS.map(l => ({ ...l, instanceId: 'inst-enlace-fibra-001' }));
  private lastKnownHash: string = 'GENESIS_ENLACE_AUDIT_HASH_2026';

  async list(instanceId?: string, limit: number = 100): Promise<AuditLog[]> {
    if (isDbConnected()) {
      try {
        const query = db.select().from(auditEventsTable);
        const condition = instanceId ? eq(auditEventsTable.instanceId, instanceId) : undefined;

        const rows = condition
          ? await query.where(condition).orderBy(desc(auditEventsTable.timestamp)).limit(limit)
          : await query.orderBy(desc(auditEventsTable.timestamp)).limit(limit);

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

  async save(input: AuditEventInput): Promise<AuditLog> {
    const id = `aud_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date();
    const timestampStr = timestamp.toISOString();
    const instanceId = input.instanceId || env.INSTANCE_ID || 'inst-enlace-fibra-001';

    // 1. Determine previous hash for tamper-evident chain
    let previousHash = this.lastKnownHash;
    if (isDbConnected()) {
      try {
        const lastRow = await db
          .select({ hashIntegridade: auditEventsTable.hashIntegridade })
          .from(auditEventsTable)
          .where(eq(auditEventsTable.instanceId, instanceId))
          .orderBy(desc(auditEventsTable.timestamp))
          .limit(1);

        if (lastRow.length > 0 && lastRow[0].hashIntegridade) {
          previousHash = lastRow[0].hashIntegridade;
        }
      } catch {
        // use in-memory chain state
      }
    }

    // 2. Compute cryptographic chain hash (SHA-256)
    const hashData = `${previousHash}|${id}|${instanceId}|${timestampStr}|${input.actorId}|${input.action}|${input.entityType}|${input.entityId}|${input.details}`;
    const hashIntegridade = crypto.createHash('sha256').update(hashData).digest('hex');
    this.lastKnownHash = hashIntegridade;

    const domainEvent: AuditLog = {
      id,
      timestamp: timestampStr,
      actorId: input.actorId,
      actorName: input.actorName,
      actorRole: input.actorRole as Role,
      action: input.action,
      entityType: input.entityType as any,
      entityId: input.entityId,
      details: input.details,
      isMaiaAction: !!input.isMaiaAction
    };

    const savedEvent = {
      ...domainEvent,
      hashIntegridade,
      previousHash
    };

    // 3. Persist to PostgreSQL (MANDATORY IN PRODUCTION)
    if (isDbConnected()) {
      try {
        await db.insert(auditEventsTable).values({
          id,
          instanceId,
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
        return savedEvent;
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

    // Fallback only in development/test
    this.fallbackEvents.unshift(savedEvent);

    return savedEvent;
  }

  async create(input: AuditEventInput): Promise<AuditLog & { hashIntegridade: string; previousHash: string }> {
    return this.save(input) as Promise<AuditLog & { hashIntegridade: string; previousHash: string }>;
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
