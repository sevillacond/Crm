import { db, isDbConnected } from '../../db/client.ts';
import { auditEventsTable, AuditEventDb } from '../../db/schema/auditEvents.ts';
import { desc, asc, eq, sql } from 'drizzle-orm';
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

export interface AuditChainVerificationResult {
  valid: boolean;
  totalEvents: number;
  error?: string;
  brokenEventId?: string;
  expectedHash?: string;
  actualHash?: string;
  reason?: string;
}

export function computeCanonicalAuditHash(
  previousHash: string,
  event: {
    id: string;
    instanceId: string;
    timestamp: string;
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    details: string;
    dadosAnteriores?: any;
    dadosPosteriores?: any;
    resultado?: string;
  }
): string {
  // P0.18: Serialização canônica determinística do payload completo
  const canonicalPayload = JSON.stringify({
    prev: previousHash,
    id: event.id,
    inst: event.instanceId,
    ts: event.timestamp,
    actId: event.actorId,
    action: event.action,
    type: event.entityType,
    entId: event.entityId,
    det: event.details,
    ant: event.dadosAnteriores !== undefined ? event.dadosAnteriores : null,
    pos: event.dadosPosteriores !== undefined ? event.dadosPosteriores : null,
    res: event.resultado || 'SUCESSO'
  });
  return crypto.createHash('sha256').update(canonicalPayload, 'utf8').digest('hex');
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

          // Calcular hash criptográfico SHA-256 canônico
          const sanitizedAnteriores = this.sanitizeData(input.dadosAnteriores);
          const sanitizedPosteriores = this.sanitizeData(input.dadosPosteriores);
          const hashIntegridade = computeCanonicalAuditHash(previousHash, {
            id,
            instanceId: finalInstanceId,
            timestamp: timestampStr,
            actorId: input.actorId,
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId,
            details: input.details,
            dadosAnteriores: sanitizedAnteriores,
            dadosPosteriores: sanitizedPosteriores,
            resultado: input.resultado || 'SUCESSO'
          });

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
            dadosAnteriores: sanitizedAnteriores,
            dadosPosteriores: sanitizedPosteriores,
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

      const sanitizedAnteriores = this.sanitizeData(input.dadosAnteriores);
      const sanitizedPosteriores = this.sanitizeData(input.dadosPosteriores);
      const hashIntegridade = computeCanonicalAuditHash(previousHash, {
        id,
        instanceId: finalInstanceId,
        timestamp: timestampStr,
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        details: input.details,
        dadosAnteriores: sanitizedAnteriores,
        dadosPosteriores: sanitizedPosteriores,
        resultado: input.resultado || 'SUCESSO'
      });

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
        dadosAnteriores: sanitizedAnteriores,
        dadosPosteriores: sanitizedPosteriores,
        resultado: input.resultado || 'SUCESSO',
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

  async verifyAuditChain(instanceId: string): Promise<AuditChainVerificationResult> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para verificar a cadeia de auditoria.');
    }

    if (isDbConnected()) {
      try {
        const rows = await db
          .select()
          .from(auditEventsTable)
          .where(eq(auditEventsTable.instanceId, instanceId))
          .orderBy(asc(auditEventsTable.timestamp), asc(auditEventsTable.id));

        return this.verifyEventsArray(instanceId, rows.map(r => ({
          id: r.id,
          instanceId: r.instanceId,
          timestamp: r.timestamp.toISOString(),
          actorId: r.actorId,
          action: r.action,
          entityType: r.entityType,
          entityId: r.entityId,
          details: r.details,
          dadosAnteriores: r.dadosAnteriores,
          dadosPosteriores: r.dadosPosteriores,
          resultado: r.resultado,
          previousHash: r.previousHash,
          hashIntegridade: r.hashIntegridade
        })));
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao verificar auditoria em produção: ${err.message}`);
        }
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Verificação de auditoria interrompida em produção.');
    }

    // Em fallback, os eventos são inseridos com unshift (mais novos primeiro)
    const instanceEvents = this.fallbackEvents
      .filter(e => e.instanceId === instanceId)
      .slice()
      .reverse(); // cronológico crescente

    return this.verifyEventsArray(instanceId, instanceEvents);
  }

  private verifyEventsArray(instanceId: string, events: any[]): AuditChainVerificationResult {
    if (events.length === 0) {
      return { valid: true, totalEvents: 0 };
    }

    for (let i = 0; i < events.length; i++) {
      const current = events[i];

      // 1. Verificar encadeamento com o evento anterior
      if (i > 0) {
        const previous = events[i - 1];
        if (current.previousHash !== previous.hashIntegridade) {
          return {
            valid: false,
            totalEvents: events.length,
            brokenEventId: current.id,
            error: 'PREVIOUS_HASH_MISMATCH',
            actualHash: current.previousHash,
            expectedHash: previous.hashIntegridade,
            reason: `Quebra de elo na cadeia de auditoria: o evento ${current.id} possui previousHash=${current.previousHash}, mas o evento anterior ${previous.id} possui hash=${previous.hashIntegridade}.`
          };
        }
      }

      // 2. Verificar integridade intrínseca recalculando o hash do payload canônico
      const computedHash = computeCanonicalAuditHash(current.previousHash || `GENESIS_${instanceId}_2026`, {
        id: current.id,
        instanceId: current.instanceId || instanceId,
        timestamp: current.timestamp,
        actorId: current.actorId,
        action: current.action,
        entityType: current.entityType,
        entityId: current.entityId,
        details: current.details,
        dadosAnteriores: current.dadosAnteriores,
        dadosPosteriores: current.dadosPosteriores,
        resultado: current.resultado
      });

      if (computedHash !== current.hashIntegridade) {
        return {
          valid: false,
          totalEvents: events.length,
          brokenEventId: current.id,
          error: 'HASH_TAMPERED',
          actualHash: current.hashIntegridade,
          expectedHash: computedHash,
          reason: `Adulteração detectada no evento ${current.id}: o hash recalculado ${computedHash} não coincide com o hash gravado ${current.hashIntegridade}. Dados ou payload violados.`
        };
      }
    }

    return { valid: true, totalEvents: events.length };
  }

  _tamperFallbackEventForTesting(instanceId: string, eventId: string, modification: Partial<any>): boolean {
    const ev = this.fallbackEvents.find(e => e.id === eventId && e.instanceId === instanceId);
    if (ev) {
      Object.assign(ev, modification);
      return true;
    }
    return false;
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
