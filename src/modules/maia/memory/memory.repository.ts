import crypto from 'crypto';
import { db, isDbConnected } from '../../../db/client.ts';
import {
  maiaConversationsTable,
  maiaMessagesTable,
  MaiaConversationDb,
  MaiaMessageDb
} from '../../../db/schema/maiaConversations.ts';
import { eq, and, desc, asc } from 'drizzle-orm';
import { env } from '../../../config/env.ts';
import {
  MaiaConversation,
  MaiaMessage,
  CreateConversationInput,
  CreateMessageInput
} from './memory.interface.ts';

export class MaiaMemoryRepository {
  private fallbackConversations = new Map<string, MaiaConversation>();
  private fallbackMessages = new Map<string, MaiaMessage[]>();

  async createConversation(input: CreateConversationInput): Promise<MaiaConversation> {
    if (!input.instanceId || input.instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para iniciar conversa na MaIA.');
    }
    if (!input.userId || input.userId.trim() === '') {
      throw new Error('userId é obrigatório para iniciar conversa na MaIA.');
    }

    const id = `conv_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date();
    const title = input.title || 'Nova Conversa';

    if (isDbConnected()) {
      try {
        await db.insert(maiaConversationsTable).values({
          id,
          instanceId: input.instanceId,
          userId: input.userId,
          title,
          dealId: input.dealId || null,
          contatoId: input.contatoId || null,
          metadata: input.metadata || null,
          createdAt: now,
          updatedAt: now
        });

        return {
          id,
          instanceId: input.instanceId,
          userId: input.userId,
          title,
          dealId: input.dealId,
          contatoId: input.contatoId,
          metadata: input.metadata,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        };
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha ao persistir conversa no PostgreSQL em produção: ${err?.message}`);
        }
        console.warn('[MaiaMemoryRepository] Falha ao persistir no Postgres:', err?.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('PostgreSQL indisponível para conversas da MaIA em produção.');
    }

    const conv: MaiaConversation = {
      id,
      instanceId: input.instanceId,
      userId: input.userId,
      title,
      dealId: input.dealId,
      contatoId: input.contatoId,
      metadata: input.metadata,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    this.fallbackConversations.set(id, conv);
    this.fallbackMessages.set(id, []);
    return conv;
  }

  async getConversationById(id: string, instanceId: string): Promise<MaiaConversation | null> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para consultar conversa.');
    }

    if (isDbConnected()) {
      try {
        const rows = await db
          .select()
          .from(maiaConversationsTable)
          .where(and(eq(maiaConversationsTable.id, id), eq(maiaConversationsTable.instanceId, instanceId)))
          .limit(1);

        if (rows.length > 0) {
          return this.mapConversation(rows[0]);
        }
        return null;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha ao buscar conversa no PostgreSQL em produção: ${err?.message}`);
        }
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('PostgreSQL indisponível em produção.');
    }

    const c = this.fallbackConversations.get(id);
    if (!c || c.instanceId !== instanceId) {
      return null;
    }
    return c;
  }

  async listConversations(instanceId: string, userId?: string, limit = 20): Promise<MaiaConversation[]> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para listar conversas.');
    }

    if (isDbConnected()) {
      try {
        const conditions = [eq(maiaConversationsTable.instanceId, instanceId)];
        if (userId) {
          conditions.push(eq(maiaConversationsTable.userId, userId));
        }

        const rows = await db
          .select()
          .from(maiaConversationsTable)
          .where(and(...conditions))
          .orderBy(desc(maiaConversationsTable.updatedAt))
          .limit(limit);

        return rows.map((r: MaiaConversationDb) => this.mapConversation(r));
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha ao listar conversas no PostgreSQL em produção: ${err?.message}`);
        }
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('PostgreSQL indisponível em produção.');
    }

    return Array.from(this.fallbackConversations.values())
      .filter(c => c.instanceId === instanceId && (!userId || c.userId === userId))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  async addMessage(input: CreateMessageInput): Promise<MaiaMessage> {
    if (!input.instanceId || input.instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para gravar mensagem da MaIA.');
    }
    if (!input.conversationId || input.conversationId.trim() === '') {
      throw new Error('conversationId é obrigatório para gravar mensagem da MaIA.');
    }

    const id = `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date();

    if (isDbConnected()) {
      try {
        await db.insert(maiaMessagesTable).values({
          id,
          conversationId: input.conversationId,
          instanceId: input.instanceId,
          role: input.role,
          content: input.content,
          toolCalls: input.toolCalls || null,
          toolResults: input.toolResults || null,
          metadata: input.metadata || null,
          createdAt: now
        });

        // Atualizar timestamp da conversa
        await db
          .update(maiaConversationsTable)
          .set({ updatedAt: now })
          .where(and(
            eq(maiaConversationsTable.id, input.conversationId),
            eq(maiaConversationsTable.instanceId, input.instanceId)
          ));

        return {
          id,
          conversationId: input.conversationId,
          instanceId: input.instanceId,
          role: input.role,
          content: input.content,
          toolCalls: input.toolCalls,
          toolResults: input.toolResults,
          metadata: input.metadata,
          createdAt: now.toISOString()
        };
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha ao salvar mensagem no PostgreSQL em produção: ${err?.message}`);
        }
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('PostgreSQL indisponível em produção.');
    }

    const msg: MaiaMessage = {
      id,
      conversationId: input.conversationId,
      instanceId: input.instanceId,
      role: input.role,
      content: input.content,
      toolCalls: input.toolCalls,
      toolResults: input.toolResults,
      metadata: input.metadata,
      createdAt: now.toISOString()
    };

    const list = this.fallbackMessages.get(input.conversationId) || [];
    list.push(msg);
    this.fallbackMessages.set(input.conversationId, list);

    const conv = this.fallbackConversations.get(input.conversationId);
    if (conv) {
      conv.updatedAt = now.toISOString();
    }

    return msg;
  }

  async getMessages(conversationId: string, instanceId: string, limit = 50): Promise<MaiaMessage[]> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para buscar histórico de mensagens.');
    }

    if (isDbConnected()) {
      try {
        const rows = await db
          .select()
          .from(maiaMessagesTable)
          .where(and(
            eq(maiaMessagesTable.conversationId, conversationId),
            eq(maiaMessagesTable.instanceId, instanceId)
          ))
          .orderBy(asc(maiaMessagesTable.createdAt))
          .limit(limit);

        return rows.map((r: MaiaMessageDb) => this.mapMessage(r));
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha ao buscar mensagens no PostgreSQL em produção: ${err?.message}`);
        }
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('PostgreSQL indisponível em produção.');
    }

    const list = this.fallbackMessages.get(conversationId) || [];
    return list.filter(m => m.instanceId === instanceId).slice(-limit);
  }

  /**
   * Compactação inteligente de histórico (Sliding Window):
   * Preserva mensagens cruciais (como a inicial de contexto) e os últimos N turnos.
   */
  compactMessages(messages: MaiaMessage[], maxTurns = 10): MaiaMessage[] {
    if (messages.length <= maxTurns) {
      return messages;
    }
    // Preservar primeira mensagem se for do sistema ou inicial
    const first = messages[0];
    const recent = messages.slice(-maxTurns);
    if (!recent.some(m => m.id === first.id)) {
      return [first, ...recent];
    }
    return recent;
  }

  private mapConversation(row: MaiaConversationDb): MaiaConversation {
    return {
      id: row.id,
      instanceId: row.instanceId,
      userId: row.userId,
      title: row.title,
      dealId: row.dealId || undefined,
      contatoId: row.contatoId || undefined,
      metadata: (row.metadata as Record<string, any>) || undefined,
      createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : new Date().toISOString()
    };
  }

  private mapMessage(row: MaiaMessageDb): MaiaMessage {
    return {
      id: row.id,
      conversationId: row.conversationId,
      instanceId: row.instanceId,
      role: row.role as 'user' | 'assistant' | 'system' | 'tool',
      content: row.content,
      toolCalls: row.toolCalls || undefined,
      toolResults: row.toolResults || undefined,
      metadata: (row.metadata as Record<string, any>) || undefined,
      createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString()
    };
  }
}

export const maiaMemoryRepository = new MaiaMemoryRepository();
