import { db, isDbConnected } from '../../db/client.ts';
import { ordensServicoTable, OrdemServicoDb } from '../../db/schema/ordensServico.ts';
import { eq, desc } from 'drizzle-orm';
import { INITIAL_ORDENS_SERVICO } from '../../data/mockData.ts';
import { OrdemServico, OSStatus, OSTipo } from '../../types/index.ts';

class OrdensRepository {
  private fallbackOrdens: OrdemServico[] = [...INITIAL_ORDENS_SERVICO];

  async getAll(): Promise<OrdemServico[]> {
    if (isDbConnected()) {
      try {
        const rows = await db
          .select()
          .from(ordensServicoTable)
          .orderBy(desc(ordensServicoTable.createdAt));

        if (rows.length > 0) {
          return rows.map(r => this.mapToDomain(r));
        }
      } catch (err: any) {
        console.warn('[OrdensRepository] Erro ao consultar OS no Postgres:', err.message);
      }
    }
    return [...this.fallbackOrdens];
  }

  async getById(id: string): Promise<OrdemServico | null> {
    if (isDbConnected()) {
      try {
        const rows = await db
          .select()
          .from(ordensServicoTable)
          .where(eq(ordensServicoTable.id, id))
          .limit(1);

        if (rows.length > 0) {
          return this.mapToDomain(rows[0]);
        }
      } catch (err: any) {
        console.warn('[OrdensRepository] Erro ao buscar OS por ID no Postgres:', err.message);
      }
    }
    return this.fallbackOrdens.find(o => o.id === id) || null;
  }

  async create(os: OrdemServico): Promise<OrdemServico> {
    this.fallbackOrdens.unshift(os);

    if (isDbConnected()) {
      try {
        await db.insert(ordensServicoTable).values({
          id: os.id,
          instanceId: 'inst_enlace_sp_001',
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
      } catch (err: any) {
        console.warn('[OrdensRepository] Erro ao persistir OS no Postgres:', err.message);
      }
    }

    return os;
  }

  async updateStatus(id: string, status: OSStatus): Promise<OrdemServico | null> {
    const idx = this.fallbackOrdens.findIndex(o => o.id === id);
    if (idx !== -1) {
      this.fallbackOrdens[idx].status = status;
    }

    if (isDbConnected()) {
      try {
        await db
          .update(ordensServicoTable)
          .set({ status, updatedAt: new Date() })
          .where(eq(ordensServicoTable.id, id));
      } catch (err: any) {
        console.warn('[OrdensRepository] Erro ao atualizar status de OS no Postgres:', err.message);
      }
    }

    return this.getById(id);
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
