import { db, isDbConnected } from '../../db/client.ts';
import { contatosTable, ContatoDb } from '../../db/schema/contatos.ts';
import { eq, isNull, and, or, ilike, desc } from 'drizzle-orm';
import { INITIAL_CONTATOS } from '../../data/mockData.ts';
import { Contato, ContatoStatus } from '../../types/index.ts';
import { env } from '../../config/env.ts';

export interface ContatosFilter {
  instanceId?: string;
  query?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

class ContatosRepository {
  private fallbackContatos: (Contato & { instanceId?: string })[] = INITIAL_CONTATOS.map(c => ({
    ...c,
    instanceId: 'inst-enlace-fibra-001'
  }));

  async findMany(filters: ContatosFilter = {}): Promise<{ data: Contato[]; total: number }> {
    const { instanceId, query, status, limit = 50, offset = 0 } = filters;

    if (isDbConnected()) {
      try {
        const conditions = [isNull(contatosTable.deletedAt)];

        // Strict Instance Isolation
        if (instanceId) {
          conditions.push(eq(contatosTable.instanceId, instanceId));
        }

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
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao consultar contatos em produção: ${err.message}`);
        }
        console.warn('[ContatosRepository] Erro ao buscar contatos no Postgres:', err.message);
      }
    }

    // Regra P0.7: Proibição estrita de fallback em produção
    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação interrompida em produção.');
    }

    // Fallback apenas em development/test
    let filtered = this.fallbackContatos.filter(c => !((c as any).deletedAt));
    if (instanceId) {
      filtered = filtered.filter(c => c.instanceId === instanceId);
    }
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

  async getById(id: string, instanceId?: string): Promise<Contato | null> {
    if (isDbConnected()) {
      try {
        const conditions = [eq(contatosTable.id, id), isNull(contatosTable.deletedAt)];
        if (instanceId) {
          conditions.push(eq(contatosTable.instanceId, instanceId));
        }

        const rows = await db
          .select()
          .from(contatosTable)
          .where(and(...conditions))
          .limit(1);

        if (rows.length > 0) {
          return this.mapToDomain(rows[0]);
        }
        return null;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao buscar contato por ID em produção: ${err.message}`);
        }
        console.warn('[ContatosRepository] Erro ao buscar contato por ID no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação interrompida em produção.');
    }

    const found = this.fallbackContatos.find(
      c => c.id === id && (!instanceId || c.instanceId === instanceId) && !((c as any).deletedAt)
    );
    return found || null;
  }

  async create(contato: Contato, instanceId?: string): Promise<Contato> {
    const finalInstanceId = instanceId || (contato as any).instanceId || env.INSTANCE_ID || 'inst-enlace-fibra-001';

    if (isDbConnected()) {
      try {
        await db.insert(contatosTable).values({
          id: contato.id,
          instanceId: finalInstanceId,
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
        return contato;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao criar contato em produção: ${err.message}`);
        }
        console.warn('[ContatosRepository] Erro ao persistir contato no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Impossível salvar contato em produção.');
    }

    this.fallbackContatos.unshift({ ...contato, instanceId: finalInstanceId });
    return contato;
  }

  async update(id: string, partial: Partial<Contato>, instanceId?: string): Promise<Contato | null> {
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

        const conditions = [eq(contatosTable.id, id), isNull(contatosTable.deletedAt)];
        if (instanceId) {
          conditions.push(eq(contatosTable.instanceId, instanceId));
        }

        await db.update(contatosTable).set(updateValues).where(and(...conditions));
        return this.getById(id, instanceId);
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao atualizar contato em produção: ${err.message}`);
        }
        console.warn('[ContatosRepository] Erro ao atualizar contato no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação interrompida em produção.');
    }

    const idx = this.fallbackContatos.findIndex(c => c.id === id && (!instanceId || c.instanceId === instanceId));
    if (idx !== -1) {
      this.fallbackContatos[idx] = { ...this.fallbackContatos[idx], ...partial };
      return this.fallbackContatos[idx];
    }

    return null;
  }

  async softDelete(id: string, instanceId?: string): Promise<boolean> {
    if (isDbConnected()) {
      try {
        const conditions = [eq(contatosTable.id, id)];
        if (instanceId) {
          conditions.push(eq(contatosTable.instanceId, instanceId));
        }

        const res = await db
          .update(contatosTable)
          .set({ deletedAt: new Date() })
          .where(and(...conditions));
        return true;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao excluir contato em produção: ${err.message}`);
        }
        console.warn('[ContatosRepository] Erro ao soft-delete contato no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação interrompida em produção.');
    }

    const idx = this.fallbackContatos.findIndex(c => c.id === id && (!instanceId || c.instanceId === instanceId));
    if (idx !== -1) {
      (this.fallbackContatos[idx] as any).deletedAt = new Date().toISOString();
      return true;
    }
    return false;
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
