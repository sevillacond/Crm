import { db, isDbConnected } from '../../db/client.ts';
import { planosTable, PlanoDb } from '../../db/schema/planos.ts';
import { eq, and } from 'drizzle-orm';
import { INITIAL_PLANOS } from '../../data/mockData.ts';
import { Plano } from '../../types/index.ts';
import { env } from '../../config/env.ts';

class PlanosRepository {
  private fallbackPlanos: (Plano & { instanceId?: string })[] = INITIAL_PLANOS.map(p => ({
    ...p,
    instanceId: 'inst-enlace-fibra-001'
  }));

  async getAll(instanceId: string): Promise<Plano[]> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para consultar planos.');
    }

    if (isDbConnected()) {
      try {
        const rows = await db
          .select()
          .from(planosTable)
          .where(and(eq(planosTable.ativo, true), eq(planosTable.instanceId, instanceId)));

        return rows.map(r => this.mapToDomain(r));
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao consultar planos em produção: ${err.message}`);
        }
        console.warn('[PlanosRepository] Falha ao consultar planos no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação interrompida em produção.');
    }

    return this.fallbackPlanos.filter(p => p.instanceId === instanceId);
  }

  async getById(id: string, instanceId: string): Promise<Plano | null> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para consultar plano.');
    }

    if (isDbConnected()) {
      try {
        const rows = await db
          .select()
          .from(planosTable)
          .where(and(eq(planosTable.id, id), eq(planosTable.instanceId, instanceId)))
          .limit(1);

        if (rows.length > 0) {
          return this.mapToDomain(rows[0]);
        }
        return null;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao buscar plano por id em produção: ${err.message}`);
        }
        console.warn('[PlanosRepository] Falha ao buscar plano por id no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação interrompida em produção.');
    }

    return this.fallbackPlanos.find(p => p.id === id && p.instanceId === instanceId) || null;
  }

  async create(plano: Plano, instanceId: string): Promise<Plano> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para cadastrar plano.');
    }

    if (isDbConnected()) {
      try {
        await db.insert(planosTable).values({
          id: plano.id,
          instanceId,
          nome: plano.nome,
          downloadMbps: plano.downloadMbps,
          uploadMbps: plano.uploadMbps,
          precoMensal: plano.precoMensal.toString(),
          adesao: plano.adesao ? plano.adesao.toString() : '0.00',
          tecnologia: plano.tecnologia,
          popular: plano.popular ?? false,
          recursos: plano.recursos || [],
          ativo: true
        });
        return plano;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco ao criar plano: ${err.message}`);
        }
        console.warn('[PlanosRepository] Falha ao persistir plano no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível em produção.');
    }

    this.fallbackPlanos.push({ ...plano, instanceId });
    return plano;
  }

  private mapToDomain(row: PlanoDb): Plano {
    return {
      id: row.id,
      nome: row.nome,
      downloadMbps: row.downloadMbps,
      uploadMbps: row.uploadMbps,
      precoMensal: Number(row.precoMensal),
      adesao: Number(row.adesao),
      tecnologia: row.tecnologia as any,
      popular: row.popular,
      recursos: (row.recursos as string[]) || []
    };
  }
}

export const planosRepository = new PlanosRepository();
