import { eq, and, isNull, or, ilike, desc } from 'drizzle-orm';
import { db, isDbConnected } from '../../db/client.ts';
import { contatosTable, ContatoDb } from '../../db/schema/contatos.ts';
import { INITIAL_CONTATOS } from '../../data/mockData.ts';
import { Contato, ContatoStatus } from '../../types/index.ts';
import { env } from '../../config/env.ts';

class ContatosRepository {
  private fallbackContatos: (Contato & { instanceId?: string })[] = INITIAL_CONTATOS.map(c => ({
    ...c,
    instanceId: 'inst-enlace-fibra-001'
  }));

  async list(filters?: {
    query?: string;
    status?: string;
    limit?: number;
    offset?: number;
    instanceId: string;
  }): Promise<{ data: Contato[]; total: number }> {
    const { query, status, limit = 50, offset = 0, instanceId } = filters || ({} as any);

    if (!instanceId && env.NODE_ENV === 'production') {
      throw new Error('instanceId é estritamente obrigatório para listar contatos em produção.');
    }

    if (isDbConnected()) {
      try {
        const conditions = [isNull(contatosTable.deletedAt)];

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

    // Regra P0: Proibição estrita de fallback em produção
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

  async getById(id: string, instanceId: string): Promise<Contato | null> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é estritamente obrigatório para consultar contato.');
    }

    if (isDbConnected()) {
      try {
        const conditions = [
          eq(contatosTable.id, id),
          eq(contatosTable.instanceId, instanceId),
          isNull(contatosTable.deletedAt)
        ];

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
      c => c.id === id && c.instanceId === instanceId && !((c as any).deletedAt)
    );
    return found || null;
  }

  async create(contato: Contato, instanceId: string): Promise<Contato> {
    const finalInstanceId = instanceId || (contato as any).instanceId;
    if (!finalInstanceId) {
      throw new Error('instanceId é obrigatório para cadastrar contato.');
    }

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
          throw new Error(`Falha ao persistir contato no banco de dados em produção: ${err.message}`);
        }
        console.warn('[ContatosRepository] Erro ao criar contato no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação interrompida em produção.');
    }

    const record = { ...contato, instanceId: finalInstanceId };
    this.fallbackContatos.unshift(record);
    return contato;
  }

  async update(id: string, partial: Partial<Contato>, instanceId: string): Promise<Contato> {
    if (!instanceId && env.NODE_ENV === 'production') {
      throw new Error('instanceId é obrigatório para atualizar contato em produção.');
    }

    if (isDbConnected()) {
      try {
        const updateValues: Record<string, any> = { updatedAt: new Date() };

        if (partial.nome !== undefined) updateValues.nome = partial.nome;
        if (partial.cpfCnpj !== undefined) updateValues.cpfCnpj = partial.cpfCnpj;
        if (partial.telefone !== undefined) updateValues.telefone = partial.telefone;
        if (partial.email !== undefined) updateValues.email = partial.email;
        if (partial.cep !== undefined) updateValues.cep = partial.cep;
        if (partial.logradouro !== undefined) updateValues.logradouro = partial.logradouro;
        if (partial.numero !== undefined) updateValues.numero = partial.numero;
        if (partial.complemento !== undefined) updateValues.complemento = partial.complemento;
        if (partial.bairro !== undefined) updateValues.bairro = partial.bairro;
        if (partial.cidade !== undefined) updateValues.cidade = partial.cidade;
        if (partial.uf !== undefined) updateValues.uf = partial.uf;
        if (partial.status !== undefined) updateValues.status = partial.status;
        if (partial.tags !== undefined) updateValues.tags = partial.tags;
        if (partial.scoreMaia !== undefined) updateValues.scoreMaia = partial.scoreMaia;
        if (partial.resumoMaia !== undefined) updateValues.resumoMaia = partial.resumoMaia;
        if (partial.origem !== undefined) updateValues.origem = partial.origem;

        const conditions = [eq(contatosTable.id, id), isNull(contatosTable.deletedAt)];
        if (instanceId) {
          conditions.push(eq(contatosTable.instanceId, instanceId));
        }

        await db
          .update(contatosTable)
          .set(updateValues)
          .where(and(...conditions));

        const updated = await this.getById(id, instanceId);
        if (!updated) {
          throw new Error('Contato não encontrado ou não pertence a esta instância.');
        }
        return updated;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha ao atualizar contato no Postgres em produção: ${err.message}`);
        }
        console.warn('[ContatosRepository] Erro ao atualizar contato no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação interrompida em produção.');
    }

    const idx = this.fallbackContatos.findIndex(c => c.id === id && (!instanceId || c.instanceId === instanceId));
    if (idx === -1) {
      throw new Error('Contato não encontrado para atualização nesta instância.');
    }
    this.fallbackContatos[idx] = { ...this.fallbackContatos[idx], ...partial };
    return this.fallbackContatos[idx];
  }

  async delete(id: string, instanceId: string): Promise<boolean> {
    if (!instanceId && env.NODE_ENV === 'production') {
      throw new Error('instanceId é obrigatório para remover contato em produção.');
    }

    if (isDbConnected()) {
      try {
        const conditions = [eq(contatosTable.id, id)];
        if (instanceId) {
          conditions.push(eq(contatosTable.instanceId, instanceId));
        }

        // Soft delete
        await db
          .update(contatosTable)
          .set({ deletedAt: new Date() })
          .where(and(...conditions));
        return true;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha ao remover contato no Postgres em produção: ${err.message}`);
        }
        console.warn('[ContatosRepository] Erro ao remover contato no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação interrompida em produção.');
    }

    const idx = this.fallbackContatos.findIndex(c => c.id === id && (!instanceId || c.instanceId === instanceId));
    if (idx !== -1) {
      (this.fallbackContatos[idx] as any).deletedAt = new Date();
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
      origem: (row.origem as any) || 'SITE',
      dataCadastro: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString()
    };
  }
}

export const contatosRepository = new ContatosRepository();
