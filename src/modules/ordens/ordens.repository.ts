import { db, isDbConnected } from '../../db/client.ts';
import { ordensServicoTable, OrdemServicoDb } from '../../db/schema/ordensServico.ts';
import { eq, desc, and } from 'drizzle-orm';
import { INITIAL_ORDENS_SERVICO } from '../../data/mockData.ts';
import { OrdemServico, OSStatus, OSTipo } from '../../types/index.ts';
import { env } from '../../config/env.ts';

class OrdensRepository {
  private fallbackOrdens: (OrdemServico & { instanceId?: string })[] = INITIAL_ORDENS_SERVICO.map(o => ({
    ...o,
    instanceId: 'inst-enlace-fibra-001'
  }));

  async getAll(instanceId?: string): Promise<OrdemServico[]> {
    if (isDbConnected()) {
      try {
        const query = db.select().from(ordensServicoTable);
        const rows = instanceId
          ? await query.where(eq(ordensServicoTable.instanceId, instanceId)).orderBy(desc(ordensServicoTable.createdAt))
          : await query.orderBy(desc(ordensServicoTable.createdAt));

        return rows.map(r => this.mapToDomain(r));
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao buscar ordens de serviço em produção: ${err.message}`);
        }
        console.warn('[OrdensRepository] Erro ao consultar OS no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação interrompida em produção.');
    }

    return this.fallbackOrdens.filter(o => !instanceId || o.instanceId === instanceId);
  }

  async getById(id: string, instanceId?: string): Promise<OrdemServico | null> {
    if (isDbConnected()) {
      try {
        const conditions = [eq(ordensServicoTable.id, id)];
        if (instanceId) {
          conditions.push(eq(ordensServicoTable.instanceId, instanceId));
        }

        const rows = await db
          .select()
          .from(ordensServicoTable)
          .where(and(...conditions))
          .limit(1);

        if (rows.length > 0) {
          return this.mapToDomain(rows[0]);
        }
        return null;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao buscar OS por ID em produção: ${err.message}`);
        }
        console.warn('[OrdensRepository] Erro ao buscar OS por ID no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação interrompida em produção.');
    }

    return this.fallbackOrdens.find(o => o.id === id && (!instanceId || o.instanceId === instanceId)) || null;
  }

  async create(os: OrdemServico, instanceId?: string): Promise<OrdemServico> {
    const finalInstanceId = instanceId || (os as any).instanceId || (env.NODE_ENV !== 'production' ? (env.INSTANCE_ID || 'inst-dev-local-001') : '');
    if (!finalInstanceId) {
      throw new Error('instanceId é obrigatório para cadastrar Ordem de Serviço em produção.');
    }

    if (isDbConnected()) {
      try {
        await db.insert(ordensServicoTable).values({
          id: os.id,
          instanceId: finalInstanceId,
          dealId: os.dealId,
          contatoId: os.contatoId,
          clienteNome: os.clienteNome,
          telefone: os.telefone,
          endereco: os.endereco,
          bairro: os.bairro,
          tipo: os.tipo,
          status: os.status,
          planoNome: os.planoNome,
          tecnicoId: os.tecnicoId,
          tecnicoNome: os.tecnicoNome,
          dataAgendada: os.dataAgendada,
          periodo: os.periodo,
          ctoDesignada: os.ctoDesignada,
          portaCto: os.portaCto,
          sinalOpticoDbm: os.sinalOpticoDbm ? String(os.sinalOpticoDbm) : null,
          metragemDropMetros: os.metragemDropMetros,
          ontSerialGpon: os.ontSerialGpon,
          roteadorWifi6Serial: os.roteadorWifi6Serial,
          checklist: os.checklist,
          observacoes: os.observacoes,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        return os;
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao persistir OS no Postgres em produção: ${err.message}`);
        }
        console.warn('[OrdensRepository] Erro ao persistir OS no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Impossível salvar OS em produção.');
    }

    this.fallbackOrdens.unshift({ ...os, instanceId: finalInstanceId });
    return os;
  }

  async updateStatus(id: string, status: OSStatus, instanceId?: string): Promise<OrdemServico | null> {
    if (isDbConnected()) {
      try {
        const conditions = [eq(ordensServicoTable.id, id)];
        if (instanceId) {
          conditions.push(eq(ordensServicoTable.instanceId, instanceId));
        }

        await db
          .update(ordensServicoTable)
          .set({ status, updatedAt: new Date() })
          .where(and(...conditions));

        return this.getById(id, instanceId);
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha no banco de dados ao atualizar status de OS em produção: ${err.message}`);
        }
        console.warn('[OrdensRepository] Erro ao atualizar status de OS no Postgres:', err.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação interrompida em produção.');
    }

    const idx = this.fallbackOrdens.findIndex(o => o.id === id && (!instanceId || o.instanceId === instanceId));
    if (idx !== -1) {
      this.fallbackOrdens[idx].status = status;
      return this.fallbackOrdens[idx];
    }

    return null;
  }

  private mapToDomain(row: OrdemServicoDb): OrdemServico {
    return {
      id: row.id,
      dealId: row.dealId || undefined,
      contatoId: row.contatoId,
      clienteNome: row.clienteNome,
      telefone: row.telefone,
      endereco: row.endereco,
      bairro: row.bairro,
      tipo: row.tipo as OSTipo,
      status: row.status as OSStatus,
      planoNome: row.planoNome,
      tecnicoId: row.tecnicoId,
      tecnicoNome: row.tecnicoNome,
      dataAgendada: row.dataAgendada,
      periodo: row.periodo as any,
      ctoDesignada: row.ctoDesignada,
      portaCto: row.portaCto,
      sinalOpticoDbm: row.sinalOpticoDbm ? Number(row.sinalOpticoDbm) : undefined,
      metragemDropMetros: row.metragemDropMetros || undefined,
      ontSerialGpon: row.ontSerialGpon || undefined,
      roteadorWifi6Serial: row.roteadorWifi6Serial || undefined,
      checklist: row.checklist,
      observacoes: row.observacoes || undefined
    };
  }
}

export const ordensRepository = new OrdensRepository();
