import { eq, and, isNull } from 'drizzle-orm';
import { db, isDbConnected } from '../../db/client.ts';
import { sessionsTable, NewSessionDb } from '../../db/schema/sessions.ts';
import { env } from '../../config/env.ts';

export interface SessionRecord {
  id: string;
  userId: string;
  instanceId?: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
}

class SessionsRepository {
  private fallbackSessions = new Map<string, SessionRecord>();

  async createSession(session: SessionRecord): Promise<void> {
    if (isDbConnected()) {
      await db.insert(sessionsTable).values({
        id: session.id,
        userId: session.userId,
        instanceId: session.instanceId,
        token: session.token,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt
      });
      return;
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível para registro de sessão em produção.');
    }

    this.fallbackSessions.set(session.token, session);
  }

  async findValidSession(token: string): Promise<SessionRecord | null> {
    if (isDbConnected()) {
      const rows = await db
        .select()
        .from(sessionsTable)
        .where(and(eq(sessionsTable.token, token), isNull(sessionsTable.revokedAt)));

      if (rows.length === 0) return null;
      const s = rows[0];

      // Check expiration
      if (new Date(s.expiresAt) < new Date()) {
        return null;
      }

      return {
        id: s.id,
        userId: s.userId,
        instanceId: s.instanceId || undefined,
        token: s.token,
        ipAddress: s.ipAddress || undefined,
        userAgent: s.userAgent || undefined,
        expiresAt: new Date(s.expiresAt),
        revokedAt: s.revokedAt ? new Date(s.revokedAt) : null,
        createdAt: new Date(s.createdAt)
      };
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível para validação de sessão em produção.');
    }

    const s = this.fallbackSessions.get(token);
    if (!s || s.revokedAt || s.expiresAt < new Date()) return null;
    return s;
  }

  async revokeSession(token: string): Promise<boolean> {
    if (isDbConnected()) {
      const result = await db
        .update(sessionsTable)
        .set({ revokedAt: new Date() })
        .where(eq(sessionsTable.token, token));
      return true;
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível para revogação de sessão em produção.');
    }

    const s = this.fallbackSessions.get(token);
    if (s) {
      s.revokedAt = new Date();
      return true;
    }
    return false;
  }
}

export const sessionsRepository = new SessionsRepository();
