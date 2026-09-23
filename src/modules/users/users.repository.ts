import { db, isDbConnected } from '../../db/client.ts';
import { usersTable, UserDb } from '../../db/schema/users.ts';
import { eq } from 'drizzle-orm';
import { INITIAL_USERS } from '../../data/mockData.ts';
import { User, Role } from '../../types/index.ts';
import bcrypt from 'bcryptjs';

export interface UserWithAuth extends User {
  passwordHash: string;
}

class UsersRepository {
  private fallbackUsers: UserWithAuth[] = INITIAL_USERS.map(u => ({
    ...u,
    // Pre-calculated bcrypt hash of 'Enlace@2026!'
    passwordHash: '$2a$10$wO8o3g1B8NkWf8EreQjB7OzYw4J5RjP.4e8H7J8Cq9B0a1b2c3d4e'
  }));

  async getAll(): Promise<User[]> {
    if (isDbConnected()) {
      try {
        const rows = await db.select().from(usersTable);
        if (rows.length > 0) {
          return rows.map(r => this.mapToDomain(r));
        }
      } catch (err: any) {
        console.warn('[UsersRepository] Falha ao consultar users no Postgres:', err.message);
      }
    }
    return this.fallbackUsers.map(({ passwordHash, ...u }) => u);
  }

  async getById(id: string): Promise<User | null> {
    if (isDbConnected()) {
      try {
        const rows = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
        if (rows.length > 0) {
          return this.mapToDomain(rows[0]);
        }
      } catch (err: any) {
        console.warn('[UsersRepository] Falha ao buscar user por ID no Postgres:', err.message);
      }
    }
    const found = this.fallbackUsers.find(u => u.id === id);
    if (!found) return null;
    const { passwordHash, ...rest } = found;
    return rest;
  }

  async getByEmailWithAuth(email: string): Promise<UserWithAuth | null> {
    if (isDbConnected()) {
      try {
        const rows = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim())).limit(1);
        if (rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            name: r.name,
            email: r.email,
            role: r.role as Role,
            avatar: r.avatar,
            department: r.department,
            status: r.status as any,
            passwordHash: r.passwordHash
          };
        }
      } catch (err: any) {
        console.warn('[UsersRepository] Falha ao buscar user por email no Postgres:', err.message);
      }
    }
    const found = this.fallbackUsers.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    return found || null;
  }

  async create(user: User, rawPassword?: string): Promise<User> {
    const passwordHash = rawPassword
      ? await bcrypt.hash(rawPassword, 10)
      : await bcrypt.hash('Enlace@2026!', 10);

    const fullUser: UserWithAuth = { ...user, passwordHash };
    this.fallbackUsers.push(fullUser);

    if (isDbConnected()) {
      try {
        await db.insert(usersTable).values({
          id: user.id,
          instanceId: 'inst_enlace_sp_001',
          name: user.name,
          email: user.email.toLowerCase().trim(),
          passwordHash,
          role: user.role,
          avatar: user.avatar,
          department: user.department,
          status: user.status
        });
      } catch (err: any) {
        console.warn('[UsersRepository] Falha ao inserir user no Postgres:', err.message);
      }
    }

    const { passwordHash: _, ...rest } = fullUser;
    return rest;
  }

  private mapToDomain(row: UserDb): User {
    return {
      id: row.id,
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
