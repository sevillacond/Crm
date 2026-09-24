import { ActorContext } from '../auth/actorContext.ts';
import { db, isDbConnected } from '../../db/client.ts';
import { maiaApprovalRequestsTable, MaiaApprovalRequestDb } from '../../db/schema/maiaApprovals.ts';
import { eq, and, desc } from 'drizzle-orm';
import { env } from '../../config/env.ts';
import crypto from 'crypto';

export type ApprovalStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTING'
  | 'EXECUTED'
  | 'FAILED';

export interface MaiaApprovalRequest {
  id: string;
  instanceId: string;
  toolName: string;
  params: any;
  paramsHash: string;
  policyVersion?: string;
  requestedBy: {
    userId: string;
    name: string;
    role: string;
  };
  status: ApprovalStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: {
    userId: string;
    name: string;
    role: string;
  };
  rejectionReason?: string;
  executedBy?: {
    userId: string;
    name: string;
    role: string;
  };
  executionResult?: any;
  executedAt?: string;
  expiresAt?: string;
  requestId?: string;
  correlationId?: string;
}

export function canonicalJsonStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJsonStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalJsonStringify(obj[k])).join(',') + '}';
}

export function calculateParamsHash(toolName: string, params: any): string {
  const serialized = canonicalJsonStringify(params || {});
  return crypto.createHash('sha256').update(`${toolName}:${serialized}`).digest('hex');
}

class ApprovalsRepository {
  private fallbackRequests = new Map<string, MaiaApprovalRequest>();
  private requestLocks = new Map<string, Promise<any>>();

  private async withLock<T>(id: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.requestLocks.get(id) || Promise.resolve();
    let resolveCurrent: () => void;
    const current = new Promise<void>((res) => {
      resolveCurrent = res;
    });
    this.requestLocks.set(id, current);
    try {
      await prev;
      return await fn();
    } finally {
      resolveCurrent!();
      if (this.requestLocks.get(id) === current) {
        this.requestLocks.delete(id);
      }
    }
  }

  async createRequest(data: {
    instanceId: string;
    toolName: string;
    params: any;
    requestedBy: {
      userId: string;
      name: string;
      role: string;
    };
    policyVersion?: string;
    expiresAt?: Date | string;
    requestId?: string;
    correlationId?: string;
  }): Promise<MaiaApprovalRequest> {
    if (!data.instanceId || data.instanceId.trim() === '') {
      throw new Error('instanceId é estritamente obrigatório para criar solicitação de aprovação.');
    }

    const id = `apr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const paramsHash = calculateParamsHash(data.toolName, data.params);
    const policyVersion = data.policyVersion || 'v1';
    const createdAt = new Date();
    const expiresAt = data.expiresAt 
      ? (data.expiresAt instanceof Date ? data.expiresAt : new Date(data.expiresAt))
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h default

    if (isDbConnected()) {
      try {
        await db.insert(maiaApprovalRequestsTable).values({
          id,
          instanceId: data.instanceId,
          toolName: data.toolName,
          params: data.params,
          paramsHash,
          policyVersion,
          requestedByUserId: data.requestedBy.userId,
          requestedByName: data.requestedBy.name,
          requestedByRole: data.requestedBy.role,
          status: 'PENDING_APPROVAL',
          createdAt,
          expiresAt,
          requestId: data.requestId || null,
          correlationId: data.correlationId || null
        });

        return {
          id,
          instanceId: data.instanceId,
          toolName: data.toolName,
          params: data.params,
          paramsHash,
          policyVersion,
          requestedBy: data.requestedBy,
          status: 'PENDING_APPROVAL',
          createdAt: createdAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
          requestId: data.requestId,
          correlationId: data.correlationId
        };
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha ao persistir aprovação no PostgreSQL em produção: ${err.message}`);
        }
        console.warn('[ApprovalsRepository] Falha ao persistir no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('PostgreSQL indisponível para aprovações em produção.');
    }

    const req: MaiaApprovalRequest = {
      id,
      instanceId: data.instanceId,
      toolName: data.toolName,
      params: data.params,
      paramsHash,
      policyVersion,
      requestedBy: data.requestedBy,
      status: 'PENDING_APPROVAL',
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      requestId: data.requestId,
      correlationId: data.correlationId
    };

    this.fallbackRequests.set(id, req);
    return req;
  }

  async getById(id: string, instanceId: string): Promise<MaiaApprovalRequest | null> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para consultar aprovação.');
    }

    if (isDbConnected()) {
      try {
        const rows = await db
          .select()
          .from(maiaApprovalRequestsTable)
          .where(and(eq(maiaApprovalRequestsTable.id, id), eq(maiaApprovalRequestsTable.instanceId, instanceId)))
          .limit(1);

        if (rows.length > 0) {
          return this.mapToDomain(rows[0]);
        }
        return null;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha ao consultar aprovação por ID no Postgres em produção: ${err.message}`);
        }
        console.warn('[ApprovalsRepository] Falha ao consultar Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('PostgreSQL indisponível para consulta de aprovação em produção.');
    }

    const req = this.fallbackRequests.get(id);
    if (!req || req.instanceId !== instanceId) {
      return null;
    }
    return req;
  }

  async listPending(instanceId: string): Promise<MaiaApprovalRequest[]> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para listar aprovações.');
    }

    if (isDbConnected()) {
      try {
        const rows = await db
          .select()
          .from(maiaApprovalRequestsTable)
          .where(and(
            eq(maiaApprovalRequestsTable.instanceId, instanceId),
            eq(maiaApprovalRequestsTable.status, 'PENDING_APPROVAL')
          ))
          .orderBy(desc(maiaApprovalRequestsTable.createdAt));

        return rows.map(r => this.mapToDomain(r));
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha ao listar aprovações no Postgres em produção: ${err.message}`);
        }
        console.warn('[ApprovalsRepository] Falha ao listar pendentes no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('PostgreSQL indisponível para listagem de aprovações em produção.');
    }

    return Array.from(this.fallbackRequests.values()).filter(
      r => r.instanceId === instanceId && r.status === 'PENDING_APPROVAL'
    );
  }

  async approve(id: string, reviewer: ActorContext): Promise<MaiaApprovalRequest> {
    if (!reviewer || !reviewer.instanceId) {
      throw new Error('Contexto de revisor ou instanceId inválido.');
    }

    const existing = await this.getById(id, reviewer.instanceId);
    if (!existing) {
      throw new Error(`Solicitação de aprovação ${id} não encontrada para a instância ${reviewer.instanceId}`);
    }
    if (existing.status !== 'PENDING_APPROVAL') {
      throw new Error(`Solicitação não pode ser aprovada no status atual (${existing.status})`);
    }
    if (existing.expiresAt && new Date(existing.expiresAt).getTime() < Date.now()) {
      throw new Error(`Solicitação de aprovação ${id} expirou e não pode ser aprovada.`);
    }

    if (isDbConnected()) {
      try {
        const resolvedAt = new Date();
        const updated = await db
          .update(maiaApprovalRequestsTable)
          .set({
            status: 'APPROVED',
            resolvedAt,
            resolvedByUserId: reviewer.userId,
            resolvedByName: reviewer.name,
            resolvedByRole: reviewer.role
          })
          .where(and(
            eq(maiaApprovalRequestsTable.id, id),
            eq(maiaApprovalRequestsTable.instanceId, reviewer.instanceId),
            eq(maiaApprovalRequestsTable.status, 'PENDING_APPROVAL')
          ))
          .returning();

        if (updated.length === 0) {
          throw new Error(`Solicitação ${id} não encontrada, já resolvida ou não pertence à instância.`);
        }

        return this.mapToDomain(updated[0]);
      } catch (err: any) {
        if (err.message.includes('não encontrada') || err.message.includes('já resolvida') || err.message.includes('expirou')) {
          throw err;
        }
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha atômica ao aprovar no Postgres em produção: ${err.message}`);
        }
        console.warn('[ApprovalsRepository] Falha atômica no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('PostgreSQL indisponível para aprovação em produção.');
    }

    return this.withLock(id, async () => {
      const req = this.fallbackRequests.get(id);
      if (!req || req.instanceId !== reviewer.instanceId) {
        throw new Error(`Solicitação de aprovação ${id} não encontrada para a instância ${reviewer.instanceId}`);
      }
      if (req.status !== 'PENDING_APPROVAL') {
        throw new Error(`Solicitação não pode ser aprovada no status atual (${req.status})`);
      }
      if (req.expiresAt && new Date(req.expiresAt).getTime() < Date.now()) {
        throw new Error(`Solicitação de aprovação ${id} expirou e não pode ser aprovada.`);
      }

      req.status = 'APPROVED';
      req.resolvedAt = new Date().toISOString();
      req.resolvedBy = {
        userId: reviewer.userId,
        name: reviewer.name,
        role: reviewer.role
      };

      return { ...req };
    });
  }

  async reject(id: string, reviewer: ActorContext, reason: string): Promise<MaiaApprovalRequest> {
    if (!reviewer || !reviewer.instanceId) {
      throw new Error('Contexto de revisor ou instanceId inválido.');
    }

    const existing = await this.getById(id, reviewer.instanceId);
    if (!existing) {
      throw new Error(`Solicitação de aprovação ${id} não encontrada para a instância ${reviewer.instanceId}`);
    }
    if (existing.status !== 'PENDING_APPROVAL') {
      throw new Error(`Solicitação não pode ser rejeitada no status atual (${existing.status})`);
    }

    if (isDbConnected()) {
      try {
        const resolvedAt = new Date();
        const updated = await db
          .update(maiaApprovalRequestsTable)
          .set({
            status: 'REJECTED',
            resolvedAt,
            resolvedByUserId: reviewer.userId,
            resolvedByName: reviewer.name,
            resolvedByRole: reviewer.role,
            rejectionReason: reason
          })
          .where(and(
            eq(maiaApprovalRequestsTable.id, id),
            eq(maiaApprovalRequestsTable.instanceId, reviewer.instanceId),
            eq(maiaApprovalRequestsTable.status, 'PENDING_APPROVAL')
          ))
          .returning();

        if (updated.length === 0) {
          throw new Error(`Solicitação ${id} não encontrada, já resolvida ou não pertence à instância.`);
        }

        return this.mapToDomain(updated[0]);
      } catch (err: any) {
        if (err.message.includes('não encontrada') || err.message.includes('já resolvida') || err.message.includes('não pode ser rejeitada')) {
          throw err;
        }
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha atômica ao rejeitar no Postgres em produção: ${err.message}`);
        }
        console.warn('[ApprovalsRepository] Falha atômica no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('PostgreSQL indisponível para rejeição em produção.');
    }

    return this.withLock(id, async () => {
      const req = this.fallbackRequests.get(id);
      if (!req || req.instanceId !== reviewer.instanceId) {
        throw new Error(`Solicitação de aprovação ${id} não encontrada para a instância ${reviewer.instanceId}`);
      }
      if (req.status !== 'PENDING_APPROVAL') {
        throw new Error(`Solicitação não pode ser rejeitada no status atual (${req.status})`);
      }

      req.status = 'REJECTED';
      req.resolvedAt = new Date().toISOString();
      req.resolvedBy = {
        userId: reviewer.userId,
        name: reviewer.name,
        role: reviewer.role
      };
      req.rejectionReason = reason;

      return { ...req };
    });
  }

  async setExecuting(id: string, executor: ActorContext): Promise<MaiaApprovalRequest> {
    if (!executor || !executor.instanceId) {
      throw new Error('Contexto de executor inválido.');
    }

    // 1. Verificar existência e status da solicitação
    const currentReq = await this.getById(id, executor.instanceId);
    if (!currentReq) {
      throw new Error(`Solicitação de aprovação ${id} não encontrada para a instância ${executor.instanceId}`);
    }

    if (currentReq.status !== 'APPROVED') {
      throw new Error(`Solicitação não pode ser executada: deve estar APPROVED (status atual: ${currentReq.status})`);
    }

    // 2. Verificar expiração
    if (currentReq.expiresAt && new Date(currentReq.expiresAt).getTime() < Date.now()) {
      throw new Error(`Solicitação de aprovação ${id} expirou e não pode ser executada.`);
    }

    // 3. Verificar integridade dos parâmetros contra paramsHash
    const calculatedHash = calculateParamsHash(currentReq.toolName, currentReq.params);
    if (currentReq.paramsHash !== calculatedHash) {
      throw new Error('PARAMS_HASH_MISMATCH: Os parâmetros da ferramenta foram adulterados após a solicitação.');
    }

    if (isDbConnected()) {
      try {
        const updated = await db
          .update(maiaApprovalRequestsTable)
          .set({
            status: 'EXECUTING',
            executedByUserId: executor.userId,
            executedByName: executor.name,
            executedByRole: executor.role
          })
          .where(and(
            eq(maiaApprovalRequestsTable.id, id),
            eq(maiaApprovalRequestsTable.instanceId, executor.instanceId),
            eq(maiaApprovalRequestsTable.status, 'APPROVED')
          ))
          .returning();

        if (updated.length === 0) {
          throw new Error(`Solicitação não pode ser executada: deve estar APPROVED e não estar em execução simultânea.`);
        }

        return this.mapToDomain(updated[0]);
      } catch (err: any) {
        if (err.message.includes('deve estar APPROVED') || err.message.includes('PARAMS_HASH_MISMATCH') || err.message.includes('expirou')) {
          throw err;
        }
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha atômica ao iniciar execução no Postgres em produção: ${err.message}`);
        }
        console.warn('[ApprovalsRepository] Falha ao iniciar execução no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('PostgreSQL indisponível para execução de aprovação em produção.');
    }

    return this.withLock(id, async () => {
      const req = this.fallbackRequests.get(id);
      if (!req || req.instanceId !== executor.instanceId) {
        throw new Error(`Solicitação ${id} não encontrada para a instância.`);
      }
      if (req.status !== 'APPROVED') {
        throw new Error(`Solicitação não pode ser executada: deve estar APPROVED (status atual: ${req.status})`);
      }
      if (req.expiresAt && new Date(req.expiresAt).getTime() < Date.now()) {
        throw new Error(`Solicitação de aprovação ${id} expirou e não pode ser executada.`);
      }

      req.status = 'EXECUTING';
      req.executedBy = {
        userId: executor.userId,
        name: executor.name,
        role: executor.role
      };

      return { ...req };
    });
  }

  async setExecuted(id: string, instanceId: string, result: any): Promise<void> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para concluir execução de aprovação.');
    }

    const executedAt = new Date();
    if (isDbConnected()) {
      try {
        const updated = await db
          .update(maiaApprovalRequestsTable)
          .set({
            status: 'EXECUTED',
            executionResult: result,
            executedAt
          })
          .where(and(
            eq(maiaApprovalRequestsTable.id, id),
            eq(maiaApprovalRequestsTable.instanceId, instanceId),
            eq(maiaApprovalRequestsTable.status, 'EXECUTING')
          ))
          .returning();

        if (updated.length === 0) {
          throw new Error(`Solicitação ${id} não pode ser concluída: deve estar em status EXECUTING e pertencer à instância.`);
        }
        return;
      } catch (err: any) {
        if (err.message.includes('não pode ser concluída')) {
          throw err;
        }
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha ao registrar conclusão de execução no Postgres: ${err.message}`);
        }
        console.warn('[ApprovalsRepository] Falha ao registrar executado no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('PostgreSQL indisponível em produção.');
    }

    return this.withLock(id, async () => {
      const req = this.fallbackRequests.get(id);
      if (!req || req.instanceId !== instanceId) {
        throw new Error(`Solicitação ${id} não encontrada para a instância ${instanceId}.`);
      }
      if (req.status !== 'EXECUTING') {
        throw new Error(`Solicitação ${id} não pode ser concluída: deve estar em status EXECUTING (status atual: ${req.status}).`);
      }
      req.status = 'EXECUTED';
      req.executionResult = result;
      req.executedAt = executedAt.toISOString();
    });
  }

  async setFailed(id: string, instanceId: string, errorResult: any): Promise<void> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para registrar falha na aprovação.');
    }

    const executedAt = new Date();
    if (isDbConnected()) {
      try {
        const updated = await db
          .update(maiaApprovalRequestsTable)
          .set({
            status: 'FAILED',
            executionResult: errorResult,
            executedAt
          })
          .where(and(
            eq(maiaApprovalRequestsTable.id, id),
            eq(maiaApprovalRequestsTable.instanceId, instanceId),
            eq(maiaApprovalRequestsTable.status, 'EXECUTING')
          ))
          .returning();

        if (updated.length === 0) {
          throw new Error(`Solicitação ${id} não pode ser marcada como FAILED: deve estar em status EXECUTING e pertencer à instância.`);
        }
        return;
      } catch (err: any) {
        if (err.message.includes('não pode ser marcada como FAILED')) {
          throw err;
        }
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha ao registrar falha de execução no Postgres: ${err.message}`);
        }
        console.warn('[ApprovalsRepository] Falha ao registrar falha no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('PostgreSQL indisponível em produção.');
    }

    return this.withLock(id, async () => {
      const req = this.fallbackRequests.get(id);
      if (!req || req.instanceId !== instanceId) {
        throw new Error(`Solicitação ${id} não encontrada para a instância ${instanceId}.`);
      }
      if (req.status !== 'EXECUTING') {
        throw new Error(`Solicitação ${id} não pode ser marcada como FAILED: deve estar em status EXECUTING (status atual: ${req.status}).`);
      }
      req.status = 'FAILED';
      req.executionResult = errorResult;
      req.executedAt = executedAt.toISOString();
    });
  }

  private mapToDomain(row: MaiaApprovalRequestDb): MaiaApprovalRequest {
    return {
      id: row.id,
      instanceId: row.instanceId,
      toolName: row.toolName,
      params: row.params,
      paramsHash: row.paramsHash,
      policyVersion: row.policyVersion,
      requestedBy: {
        userId: row.requestedByUserId,
        name: row.requestedByName,
        role: row.requestedByRole
      },
      status: row.status as ApprovalStatus,
      createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
      resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : undefined,
      resolvedBy: row.resolvedByUserId
        ? {
            userId: row.resolvedByUserId,
            name: row.resolvedByName || '',
            role: row.resolvedByRole || ''
          }
        : undefined,
      rejectionReason: row.rejectionReason || undefined,
      executedBy: row.executedByUserId
        ? {
            userId: row.executedByUserId,
            name: row.executedByName || '',
            role: row.executedByRole || ''
          }
        : undefined,
      executionResult: row.executionResult || undefined,
      executedAt: row.executedAt ? row.executedAt.toISOString() : undefined,
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : undefined,
      requestId: row.requestId || undefined,
      correlationId: row.correlationId || undefined
    };
  }
}

export const maiaApprovalsRepository = new ApprovalsRepository();
