import { db, isDbConnected } from '../../db/client.ts';
import { usersTable, UserDb } from '../../db/schema/users.ts';
import { eq, and } from 'drizzle-orm';
import { INITIAL_USERS } from '../../data/mockData.ts';
import { User, Role } from '../../types/index.ts';
import { env } from '../../config/env.ts';
import bcrypt from 'bcryptjs';

export interface UserWithAuth extends User {
  passwordHash: string;
}

class UsersRepository {
  private fallbackUsers: (UserWithAuth & { instanceId?: string })[] = INITIAL_USERS.map(u => ({
    ...u,
    instanceId: 'inst-enlace-fibra-001',
    passwordHash: '$2a$10$iMh.OQf9n1q4T7E14y17c.yJb6R6yJ7G8n9k.Wz1e9c2b3d4e5f6g'
  }));

  async getAll(instanceId?: string): Promise<User[]> {
    if (isDbConnected()) {
      try {
        const query = db.select().from(usersTable);
        const rows = instanceId
          ? await query.where(eq(usersTable.instanceId, instanceId))
          : await query;

        return rows.map(r => this.mapToDomain(r));
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao buscar usuários em produção: ${err.message}`);
        }
        console.warn('[UsersRepository] Falha ao consultar users no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação interrompida em produção.');
    }

    return this.fallbackUsers
      .filter(u => !instanceId || u.instanceId === instanceId)
      .map(({ passwordHash, ...u }) => u);
  }

  async getById(id: string, instanceId?: string): Promise<User | null> {
    if (isDbConnected()) {
      try {
        const conditions = [eq(usersTable.id, id)];
        if (instanceId) {
          conditions.push(eq(usersTable.instanceId, instanceId));
        }

        const rows = await db
          .select()
          .from(usersTable)
          .where(and(...conditions))
          .limit(1);

        if (rows.length > 0) {
          return this.mapToDomain(rows[0]);
        }
        return null;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao buscar usuário por ID em produção: ${err.message}`);
        }
        console.warn('[UsersRepository] Falha ao buscar user por ID no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação interrompida em produção.');
    }

    const found = this.fallbackUsers.find(
      u => u.id === id && (!instanceId || u.instanceId === instanceId)
    );
    if (!found) return null;
    const { passwordHash, ...rest } = found;
    return rest;
  }

  async getByEmailWithAuth(email: string, instanceId?: string): Promise<UserWithAuth | null> {
    const normalized = email.toLowerCase().trim();

    if (isDbConnected()) {
      try {
        const conditions = [eq(usersTable.email, normalized)];
        if (instanceId) {
          conditions.push(eq(usersTable.instanceId, instanceId));
        }

        const rows = await db
          .select()
          .from(usersTable)
          .where(and(...conditions))
          .limit(1);

        if (rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            instanceId: r.instanceId,
            name: r.name,
            email: r.email,
            role: r.role as Role,
            avatar: r.avatar,
            department: r.department,
            status: r.status as any,
            passwordHash: r.passwordHash
          };
        }
        return null;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao buscar usuário por e-mail em produção: ${err.message}`);
        }
        console.warn('[UsersRepository] Falha ao buscar user por email no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação interrompida em produção.');
    }

    const found = this.fallbackUsers.find(
      u => u.email.toLowerCase() === normalized && (!instanceId || u.instanceId === instanceId)
    );
    return found || null;
  }

  async create(user: User, rawPassword?: string, instanceId?: string): Promise<User> {
    const finalInstanceId = instanceId || user.instanceId || env.INSTANCE_ID || 'inst-enlace-fibra-001';

    if (!rawPassword && env.NODE_ENV === 'production') {
      throw new Error('A senha de usuário é obrigatória para cadastro em produção.');
    }

    const passwordHash = rawPassword
      ? await bcrypt.hash(rawPassword, 12)
      : await bcrypt.hash('Enlace@2026!', 10);

    const fullUser: UserWithAuth = { ...user, instanceId: finalInstanceId, passwordHash };

    if (isDbConnected()) {
      try {
        await db.insert(usersTable).values({
          id: user.id,
          instanceId: finalInstanceId,
          name: user.name,
          email: user.email.toLowerCase().trim(),
          passwordHash,
          role: user.role,
          avatar: user.avatar,
          department: user.department,
          status: user.status
        });
        const { passwordHash: _, ...rest } = fullUser;
        return rest;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao criar usuário no Postgres em produção: ${err.message}`);
        }
        console.warn('[UsersRepository] Falha ao inserir user no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Impossível criar usuário em produção.');
    }

    this.fallbackUsers.push(fullUser);
    const { passwordHash: _, ...rest } = fullUser;
    return rest;
  }

  private mapToDomain(row: UserDb): User {
    return {
      id: row.id,
      instanceId: row.instanceId,
      name: row.name,
      email: row.email,
      role: row.role as Role,
      avatar: row.avatar,
      department: row.department,
      status: row.status as any
    };
  }
}

export const usersRepository = new UsersRepository();
