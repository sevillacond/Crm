import { db, isDbConnected } from '../../db/client.ts';
import { contatosTable, ContatoDb } from '../../db/schema/contatos.ts';
import { eq, isNull, and, or, ilike, desc } from 'drizzle-orm';
import { INITIAL_CONTATOS } from '../../data/mockData.ts';
import { Contato, ContatoStatus } from '../../types/index.ts';

export interface ContatosFilter {
  query?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

class ContatosRepository {
  private fallbackContatos: Contato[] = [...INITIAL_CONTATOS];

  async findMany(filters: ContatosFilter = {}): Promise<{ data: Contato[]; total: number }> {
    const { query, status, limit = 50, offset = 0 } = filters;

    if (isDbConnected()) {
      try {
        const conditions = [isNull(contatosTable.deletedAt)];

        if (status) {
          conditions.push(eq(contatosTable.status, status));
        }

        if (query) {
          const q = `%${query}%`;
          conditions.push(
            or(
              ilike(contatosTable.nome, q),
              ilike(contatosTable.cpfCnpj, q),
              ilike(contatosTable.telefone, q),
              ilike(contatosTable.cidade, q),
              ilike(contatosTable.bairro, q)
            )!
          );
        }

        const rows = await db
          .select()
          .from(contatosTable)
          .where(and(...conditions))
          .orderBy(desc(contatosTable.createdAt))
          .limit(limit)
          .offset(offset);

        return {
          data: rows.map(r => this.mapToDomain(r)),
          total: rows.length
        };
      } catch (err: any) {
        console.warn('[ContatosRepository] Erro ao buscar contatos no Postgres:', err.message);
      }
    }

    // Resilient fallback
    let filtered = this.fallbackContatos.filter(c => !((c as any).deletedAt));
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.nome.toLowerCase().includes(q) ||
          c.telefone.includes(q) ||
          c.cpfCnpj.includes(q) ||
          c.cidade.toLowerCase().includes(q) ||
          c.bairro.toLowerCase().includes(q)
      );
    }
    if (status) {
      filtered = filtered.filter(c => c.status === status);
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);
    return { data: paginated, total };
  }

  async getById(id: string): Promise<Contato | null> {
    if (isDbConnected()) {
      try {
        const rows = await db
          .select()
          .from(contatosTable)
          .where(and(eq(contatosTable.id, id), isNull(contatosTable.deletedAt)))
          .limit(1);
        if (rows.length > 0) {
          return this.mapToDomain(rows[0]);
        }
      } catch (err: any) {
        console.warn('[ContatosRepository] Erro ao buscar contato por ID no Postgres:', err.message);
      }
    }
    const found = this.fallbackContatos.find(c => c.id === id && !((c as any).deletedAt));
    return found || null;
  }

  async create(contato: Contato): Promise<Contato> {
    this.fallbackContatos.unshift(contato);

    if (isDbConnected()) {
      try {
        await db.insert(contatosTable).values({
          id: contato.id,
          instanceId: 'inst_enlace_sp_001',
          nome: contato.nome,
          cpfCnpj: contato.cpfCnpj,
          telefone: contato.telefone,
          email: contato.email,
          cep: contato.cep,
          logradouro: contato.logradouro,
          numero: contato.numero,
          complemento: contato.complemento,
          bairro: contato.bairro,
          cidade: contato.cidade,
          uf: contato.uf,
          status: contato.status,
          tags: contato.tags,
          scoreMaia: contato.scoreMaia,
          resumoMaia: contato.resumoMaia,
          origem: contato.origem,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } catch (err: any) {
        console.warn('[ContatosRepository] Erro ao persistir contato no Postgres:', err.message);
      }
    }

    return contato;
  }

  async update(id: string, partial: Partial<Contato>): Promise<Contato | null> {
    const idx = this.fallbackContatos.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.fallbackContatos[idx] = { ...this.fallbackContatos[idx], ...partial };
    }

    if (isDbConnected()) {
      try {
        const updateValues: Record<string, any> = { updatedAt: new Date() };
        if (partial.nome !== undefined) updateValues.nome = partial.nome;
        if (partial.telefone !== undefined) updateValues.telefone = partial.telefone;
        if (partial.email !== undefined) updateValues.email = partial.email;
        if (partial.status !== undefined) updateValues.status = partial.status;
        if (partial.scoreMaia !== undefined) updateValues.scoreMaia = partial.scoreMaia;
        if (partial.resumoMaia !== undefined) updateValues.resumoMaia = partial.resumoMaia;
        if (partial.tags !== undefined) updateValues.tags = partial.tags;

        await db.update(contatosTable)
          .set(updateValues)
          .where(eq(contatosTable.id, id));
      } catch (err: any) {
        console.warn('[ContatosRepository] Erro ao atualizar contato no Postgres:', err.message);
      }
    }

    return this.getById(id);
  }

  async softDelete(id: string): Promise<boolean> {
    const idx = this.fallbackContatos.findIndex(c => c.id === id);
    if (idx !== -1) {
      (this.fallbackContatos[idx] as any).deletedAt = new Date().toISOString();
    }

    if (isDbConnected()) {
      try {
        await db.update(contatosTable)
          .set({ deletedAt: new Date() })
          .where(eq(contatosTable.id, id));
        return true;
      } catch (err: any) {
        console.warn('[ContatosRepository] Erro ao soft-delete contato no Postgres:', err.message);
      }
    }
    return idx !== -1;
  }

  private mapToDomain(row: ContatoDb): Contato {
    return {
      id: row.id,
      nome: row.nome,
      cpfCnpj: row.cpfCnpj,
      telefone: row.telefone,
      email: row.email,
      cep: row.cep,
      logradouro: row.logradouro,
      numero: row.numero,
      complemento: row.complemento || undefined,
      bairro: row.bairro,
      cidade: row.cidade,
      uf: row.uf,
      status: row.status as ContatoStatus,
      tags: (row.tags as string[]) || [],
      scoreMaia: row.scoreMaia || undefined,
      resumoMaia: row.resumoMaia || undefined,
      origem: row.origem as any,
      dataCadastro: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
      ultimoContato: row.ultimoContato ? row.ultimoContato.toISOString() : undefined
    };
  }
}

export const contatosRepository = new ContatosRepository();
