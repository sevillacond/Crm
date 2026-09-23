import { db, isDbConnected } from '../../db/client.ts';
import { auditEventsTable, AuditEventDb } from '../../db/schema/auditEvents.ts';
import { desc, eq, and } from 'drizzle-orm';
import { INITIAL_AUDIT_LOGS } from '../../data/mockData.ts';
import { AuditLog, Role } from '../../types/index.ts';
import crypto from 'crypto';

export interface AuditEventInput {
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
  private fallbackEvents: AuditLog[] = [...INITIAL_AUDIT_LOGS];

  async list(limit: number = 100): Promise<AuditLog[]> {
    if (isDbConnected()) {
      try {
        const rows = await db
          .select()
          .from(auditEventsTable)
          .orderBy(desc(auditEventsTable.timestamp))
          .limit(limit);

        if (rows.length > 0) {
          return rows.map(r => this.mapToDomain(r));
        }
      } catch (err: any) {
        console.warn('[AuditoriaRepository] Falha ao consultar auditoria no Postgres:', err.message);
      }
    }
    return [...this.fallbackEvents].slice(0, limit);
  }

  async save(input: AuditEventInput): Promise<AuditLog> {
    const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestampStr = new Date().toISOString();

    // Checksum for event integrity (HMAC/SHA256 hash of event core data)
    const hashData = `${id}|${timestampStr}|${input.actorId}|${input.action}|${input.entityType}|${input.entityId}`;
    const hashIntegridade = crypto.createHash('sha256').update(hashData).digest('hex');

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

    this.fallbackEvents.unshift(domainEvent);

    if (isDbConnected()) {
      try {
        await db.insert(auditEventsTable).values({
          id,
          instanceId: 'inst_enlace_sp_001',
          timestamp: new Date(),
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
          dadosAnteriores: input.dadosAnteriores || null,
          dadosPosteriores: input.dadosPosteriores || null,
          origem: input.origem || 'WEB_CRM',
          resultado: input.resultado || 'SUCESSO',
          isMaiaAction: !!input.isMaiaAction,
          hashIntegridade
        });
      } catch (err: any) {
        console.warn('[AuditoriaRepository] Erro ao persistir evento no Postgres:', err.message);
      }
    }

    return domainEvent;
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
