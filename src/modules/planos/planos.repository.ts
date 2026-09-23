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

  async getAll(instanceId?: string): Promise<Plano[]> {
    if (isDbConnected()) {
      try {
        const conditions = [eq(planosTable.ativo, true)];
        if (instanceId) {
          conditions.push(eq(planosTable.instanceId, instanceId));
        }

        const rows = await db
          .select()
          .from(planosTable)
          .where(and(...conditions));

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

    return this.fallbackPlanos.filter(p => !instanceId || p.instanceId === instanceId);
  }

  async getById(id: string, instanceId?: string): Promise<Plano | null> {
    if (isDbConnected()) {
      try {
        const conditions = [eq(planosTable.id, id)];
        if (instanceId) {
          conditions.push(eq(planosTable.instanceId, instanceId));
        }

        const rows = await db
          .select()
          .from(planosTable)
          .where(and(...conditions))
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

    return this.fallbackPlanos.find(p => p.id === id && (!instanceId || p.instanceId === instanceId)) || null;
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
