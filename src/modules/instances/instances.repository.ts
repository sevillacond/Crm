import { db, isDbConnected } from '../../db/client.ts';
import { instancesTable, InstanceDb } from '../../db/schema/instances.ts';
import { eq } from 'drizzle-orm';
import { INITIAL_INSTANCE } from '../../data/mockData.ts';
import { InstanceConfig } from '../../types/index.ts';
import { env } from '../../config/env.ts';

class InstancesRepository {
  private fallbackInstances = new Map<string, InstanceConfig>([
    [INITIAL_INSTANCE.instanceId, { ...INITIAL_INSTANCE, maiaNivelAutonomia: 3 }]
  ]);

  async getById(id: string): Promise<InstanceConfig | null> {
    if (!id && env.NODE_ENV === 'production') {
      throw new Error('instanceId é obrigatório para consultar instância.');
    }

    if (isDbConnected()) {
      try {
        const rows = await db.select().from(instancesTable).where(eq(instancesTable.id, id)).limit(1);
        if (rows.length > 0) {
          const row = rows[0];
          return this.mapToDomain(row);
        }
        return null;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco ao consultar instância ${id} em produção: ${err.message}`);
        }
        console.warn('[InstancesRepository] Falha ao consultar Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação de instância interrompida em produção.');
    }

    // Em dev/test: recuperar ou inicializar a instância isolada solicitada
    if (!this.fallbackInstances.has(id)) {
      this.fallbackInstances.set(id, {
        ...INITIAL_INSTANCE,
        instanceId: id,
        maiaNivelAutonomia: 3
      });
    }

    return this.fallbackInstances.get(id) || null;
  }

  async getDefault(): Promise<InstanceConfig> {
    if (env.NODE_ENV === 'production') {
      if (env.INSTANCE_ID) {
        const inst = await this.getById(env.INSTANCE_ID);
        if (inst) return inst;
      }
      throw new Error('Instância padrão não disponível em produção.');
    }

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

    return this.fallbackInstances.get(INITIAL_INSTANCE.instanceId) || { ...INITIAL_INSTANCE, maiaNivelAutonomia: 3 };
  }

  async update(id: string, partial: Partial<InstanceConfig>): Promise<InstanceConfig> {
    if (!id && env.NODE_ENV === 'production') {
      throw new Error('instanceId é obrigatório para atualizar instância.');
    }

    if (isDbConnected()) {
      try {
        const updateValues: Record<string, any> = { updatedAt: new Date() };
        if (partial.nomeFantasia !== undefined) updateValues.nomeFantasia = partial.nomeFantasia;
        if (partial.cidadeSede !== undefined) updateValues.cidadeSede = partial.cidadeSede;
        if (partial.totalCtos !== undefined) updateValues.totalCtos = partial.totalCtos;
        if (partial.totalPortasDisponiveis !== undefined) updateValues.totalPortasDisponiveis = partial.totalPortasDisponiveis;
        if (partial.maiaNivelAutonomia !== undefined) updateValues.maiaNivelAutonomia = partial.maiaNivelAutonomia;

        await db.update(instancesTable)
          .set(updateValues)
          .where(eq(instancesTable.id, id));

        const updated = await this.getById(id);
        if (updated) return updated;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha ao persistir atualização da instância no Postgres em produção: ${err.message}`);
        }
        console.warn('[InstancesRepository] Falha ao persistir update de instância no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação de atualização interrompida em produção.');
    }

    const current = this.fallbackInstances.get(id) || {
      ...INITIAL_INSTANCE,
      instanceId: id,
      maiaNivelAutonomia: 3
    };

    const updated = { ...current, ...partial };
    this.fallbackInstances.set(id, updated);
    return updated;
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
      versaoMaia: row.versaoMaia,
      maiaNivelAutonomia: row.maiaNivelAutonomia ?? 3
    };
  }
}

export const instancesRepository = new InstancesRepository();
