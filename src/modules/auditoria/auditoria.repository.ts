import { db, isDbConnected } from '../../db/client.ts';
import { auditEventsTable, AuditEventDb } from '../../db/schema/auditEvents.ts';
import { desc, eq, sql } from 'drizzle-orm';
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
  private memoryLocks = new Map<string, Promise<any>>();

  private fallbackEvents: (AuditLog & { instanceId?: string; hashIntegridade?: string; previousHash?: string })[] =
    INITIAL_AUDIT_LOGS.map(l => ({
      ...l,
      instanceId: 'inst-enlace-fibra-001',
      hashIntegridade: 'GENESIS_inst-enlace-fibra-001_2026',
      previousHash: 'ROOT'
    }));

  private async withMemoryLock<T>(instanceId: string, fn: () => Promise<T>): Promise<T> {
    const previousLock = this.memoryLocks.get(instanceId) || Promise.resolve();
    let resolveCurrent: () => void;
    const currentLock = new Promise<void>((resolve) => {
      resolveCurrent = resolve;
    });
    this.memoryLocks.set(instanceId, currentLock);

    try {
      await previousLock;
      return await fn();
    } finally {
      resolveCurrent!();
      if (this.memoryLocks.get(instanceId) === currentLock) {
        this.memoryLocks.delete(instanceId);
      }
    }
  }

  async list(instanceId: string, limit: number = 100): Promise<AuditLog[]> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é estritamente obrigatório para consultar auditoria.');
    }

    if (isDbConnected()) {
      try {
        const rows = await db
          .select()
          .from(auditEventsTable)
          .where(eq(auditEventsTable.instanceId, instanceId))
          .orderBy(desc(auditEventsTable.timestamp), desc(auditEventsTable.id))
          .limit(limit);

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

    const filtered = this.fallbackEvents.filter(e => e.instanceId === instanceId);
    return [...filtered].slice(0, limit);
  }

  async save(input: AuditEventInput): Promise<AuditLog & { hashIntegridade: string; previousHash: string }> {
    const instanceId = input.instanceId;
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('Falha de auditoria: instanceId é estritamente obrigatório para registrar eventos de auditoria.');
    }
    const finalInstanceId = instanceId;

    const id = `aud_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date();
    const timestampStr = timestamp.toISOString();

    // 1. Transactional & concurrency-safe chaining in PostgreSQL
    if (isDbConnected()) {
      try {
        const result = await db.transaction(async (tx) => {
          // P1: PostgreSQL Advisory Lock por instanceId serializa gravações concorrentes sem bifurcação
          await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${finalInstanceId}))`);

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

    // Fallback apenas em dev/test serializado por instanceId
    return this.withMemoryLock(finalInstanceId, async () => {
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
    });
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
      instanceId: row.instanceId,
      timestamp: row.timestamp ? row.timestamp.toISOString() : new Date().toISOString(),
      actorId: row.actorId,
      actorName: row.actorName,
      actorRole: row.actorRole as Role,
      action: row.action,
      entityType: row.entityType as any,
      entityId: row.entityId,
      details: row.details,
      isMaiaAction: row.isMaiaAction,
      hashIntegridade: row.hashIntegridade || undefined,
      previousHash: row.previousHash || undefined
    };
  }
}

export const auditoriaRepository = new AuditoriaRepository();
