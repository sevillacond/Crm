import { db, isDbConnected } from '../../db/client.ts';
import { instancesTable, InstanceDb } from '../../db/schema/instances.ts';
import { eq } from 'drizzle-orm';
import { INITIAL_INSTANCE } from '../../data/mockData.ts';
import { InstanceConfig } from '../../types/index.ts';

class InstancesRepository {
  private fallbackInstance: InstanceConfig = { ...INITIAL_INSTANCE };

  async getById(id: string): Promise<InstanceConfig | null> {
    if (isDbConnected()) {
      try {
        const rows = await db.select().from(instancesTable).where(eq(instancesTable.id, id)).limit(1);
        if (rows.length > 0) {
          const row = rows[0];
          return this.mapToDomain(row);
        }
      } catch (err: any) {
        console.warn('[InstancesRepository] Falha ao consultar Postgres, usando cache local:', err.message);
      }
    }
    return this.fallbackInstance.instanceId === id ? this.fallbackInstance : this.fallbackInstance;
  }

  async getDefault(): Promise<InstanceConfig> {
    if (isDbConnected()) {
      try {
        const rows = await db.select().from(instancesTable).limit(1);
        if (rows.length > 0) {
          return this.mapToDomain(rows[0]);
        }
      } catch (err: any) {
        console.warn('[InstancesRepository] Falha ao obter default do Postgres:', err.message);
      }
    }
    return this.fallbackInstance;
  }

  async update(id: string, partial: Partial<InstanceConfig>): Promise<InstanceConfig> {
    this.fallbackInstance = { ...this.fallbackInstance, ...partial };
    if (isDbConnected()) {
      try {
        await db.update(instancesTable)
          .set({
            nomeFantasia: partial.nomeFantasia,
            cidadeSede: partial.cidadeSede,
            totalCtos: partial.totalCtos,
            totalPortasDisponiveis: partial.totalPortasDisponiveis,
            updatedAt: new Date()
          })
          .where(eq(instancesTable.id, id));
      } catch (err: any) {
        console.warn('[InstancesRepository] Falha ao persistir update de instância no Postgres:', err.message);
      }
    }
    return this.fallbackInstance;
  }

  private mapToDomain(row: InstanceDb): InstanceConfig {
    return {
      instanceId: row.id,
      cnpj: row.cnpj,
      razaoSocial: row.razaoSocial,
      nomeFantasia: row.nomeFantasia,
      cidadeSede: row.cidadeSede,
      uf: row.uf,
      timezone: row.timezone,
      status: row.status as any,
      databaseEngine: row.databaseEngine as any,
      sgpIntegrado: row.sgpIntegrado as any,
      totalCtos: row.totalCtos,
      totalPortasDisponiveis: row.totalPortasDisponiveis,
      versaoMaia: row.versaoMaia
    };
  }
}

export const instancesRepository = new InstancesRepository();
