import { db, isDbConnected } from '../../db/client.ts';
import { planosTable, PlanoDb } from '../../db/schema/planos.ts';
import { eq } from 'drizzle-orm';
import { INITIAL_PLANOS } from '../../data/mockData.ts';
import { Plano } from '../../types/index.ts';

class PlanosRepository {
  private fallbackPlanos: Plano[] = [...INITIAL_PLANOS];

  async getAll(): Promise<Plano[]> {
    if (isDbConnected()) {
      try {
        const rows = await db.select().from(planosTable).where(eq(planosTable.ativo, true));
        if (rows.length > 0) {
          return rows.map(r => this.mapToDomain(r));
        }
      } catch (err: any) {
        console.warn('[PlanosRepository] Falha ao consultar planos no Postgres:', err.message);
      }
    }
    return [...this.fallbackPlanos];
  }

  async getById(id: string): Promise<Plano | null> {
    if (isDbConnected()) {
      try {
        const rows = await db.select().from(planosTable).where(eq(planosTable.id, id)).limit(1);
        if (rows.length > 0) {
          return this.mapToDomain(rows[0]);
        }
      } catch (err: any) {
        console.warn('[PlanosRepository] Falha ao buscar plano por id no Postgres:', err.message);
      }
    }
    return this.fallbackPlanos.find(p => p.id === id) || null;
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
