import { ActorContext } from '../auth/actorContext.ts';
import crypto from 'crypto';

export type ApprovalStatus =
  | 'REQUESTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTING'
  | 'EXECUTED';

export interface MaiaApprovalRequest {
  id: string;
  instanceId: string;
  toolName: string;
  params: any;
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
  executionResult?: any;
}

class ApprovalsRepository {
  private requests = new Map<string, MaiaApprovalRequest>();

  async createRequest(
    data: Omit<MaiaApprovalRequest, 'id' | 'status' | 'createdAt'>
  ): Promise<MaiaApprovalRequest> {
    const id = `apr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const request: MaiaApprovalRequest = {
      ...data,
      id,
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString()
    };

    this.requests.set(id, request);
    return request;
  }

  async getById(id: string, instanceId: string): Promise<MaiaApprovalRequest | null> {
    const req = this.requests.get(id);
    if (!req || req.instanceId !== instanceId) {
      return null;
    }
    return req;
  }

  async listPending(instanceId: string): Promise<MaiaApprovalRequest[]> {
    return Array.from(this.requests.values()).filter(
      r => r.instanceId === instanceId && r.status === 'PENDING_APPROVAL'
    );
  }

  async approve(id: string, reviewer: ActorContext): Promise<MaiaApprovalRequest> {
    const req = await this.getById(id, reviewer.instanceId);
    if (!req) {
      throw new Error(`Solicitação de aprovação ${id} não encontrada para a instância ${reviewer.instanceId}`);
    }
    if (req.status !== 'PENDING_APPROVAL') {
      throw new Error(`Solicitação não pode ser aprovada no status atual (${req.status})`);
    }

    req.status = 'APPROVED';
    req.resolvedAt = new Date().toISOString();
    req.resolvedBy = {
      userId: reviewer.userId,
      name: reviewer.name,
      role: reviewer.role
    };

    return req;
  }

  async reject(id: string, reviewer: ActorContext, reason: string): Promise<MaiaApprovalRequest> {
    const req = await this.getById(id, reviewer.instanceId);
    if (!req) {
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

    return req;
  }

  async setExecuting(id: string, instanceId: string): Promise<void> {
    const req = await this.getById(id, instanceId);
    if (req) {
      req.status = 'EXECUTING';
    }
  }

  async setExecuted(id: string, instanceId: string, result: any): Promise<void> {
    const req = await this.getById(id, instanceId);
    if (req) {
      req.status = 'EXECUTED';
      req.executionResult = result;
    }
  }
}

export const maiaApprovalsRepository = new ApprovalsRepository();
