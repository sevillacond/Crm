import { db, isDbConnected } from '../../db/client.ts';
import { callsTable, CallDb } from '../../db/schema/calls.ts';
import { eq, desc } from 'drizzle-orm';
import { ActorContext } from '../auth/actorContext.ts';
import { auditoriaService } from '../auditoria/auditoria.service.ts';
import { env } from '../../config/env.ts';

export interface ChamadaRecord {
  id: string;
  instanceId: string;
  providerCallId?: string;
  asteriskChannelId?: string;
  ramalOrigem: string;
  numeroDestino: string;
  nomeContato?: string;
  contatoId?: string;
  direcao: 'ENTRANTE' | 'SAINTE';
  status: 'ATENDIDA' | 'NAO_ATENDIDA' | 'OCUPADO' | 'FALHA' | 'RINGING' | 'ANSWERED' | 'HANGUP' | 'BUSY' | 'FAILED' | 'DISCANDO' | 'CONECTADA' | 'FINALIZADA';
  duracaoSegundos: number;
  iniciadaEm: string;
  finalizadaEm?: string;
  answeredAt?: string;
  gravacaoUrl?: string | null;
  notasOperador?: string;
  operadorId: string;
  operadorNome: string;
}

class TelefoniaService {
  private fallbackStore = new Map<string, ChamadaRecord[]>();

  constructor() {
    // Seed apenas em ambiente local/desenvolvimento
    if (env.NODE_ENV !== 'production') {
      this.seedDevData();
    }
  }

  private seedDevData() {
    const devChamadas: ChamadaRecord[] = [
      {
        id: 'CALL-2026-001',
        instanceId: 'inst-dev-local-001',
        ramalOrigem: '1004 (Fila Suporte)',
        numeroDestino: '(11) 98765-4321',
        nomeContato: 'Mariana Silva Costa',
        contatoId: 'c1',
        direcao: 'SAINTE',
        status: 'ATENDIDA',
        duracaoSegundos: 192,
        iniciadaEm: new Date(Date.now() - 3600000).toISOString(),
        finalizadaEm: new Date(Date.now() - 3408000).toISOString(),
        gravacaoUrl: null, // Zero Fake Success: sem URL falsa
        notasOperador: 'Cliente confirmou recepção da fatura e solicitou esclarecimento sobre plano Fibra 600.',
        operadorId: 'usr_admin',
        operadorNome: 'Admin Enlace'
      }
    ];
    this.fallbackStore.set('inst-dev-local-001', devChamadas);
  }

  public async getChamadas(instanceId: string): Promise<ChamadaRecord[]> {
    if (!instanceId) return [];

    if (isDbConnected()) {
      try {
        const rows = await db
          .select()
          .from(callsTable)
          .where(eq(callsTable.instanceId, instanceId))
          .orderBy(desc(callsTable.startedAt));

        return rows.map(r => this.mapToDomain(r));
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha ao consultar chamadas telefônicas no PostgreSQL: ${err.message}`);
        }
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL indisponível. Operação interrompida em produção.');
    }

    return this.fallbackStore.get(instanceId) || [];
  }

  public async registrarChamada(
    dados: Omit<ChamadaRecord, 'id' | 'instanceId' | 'operadorId' | 'operadorNome'>,
    actor: ActorContext
  ): Promise<ChamadaRecord> {
    if (!actor || !actor.instanceId) {
      throw new Error('Instância ou autorização ausente.');
    }

    const id = `CALL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const startedAt = dados.iniciadaEm ? new Date(dados.iniciadaEm) : new Date();
    const endedAt = dados.finalizadaEm ? new Date(dados.finalizadaEm) : undefined;
    const answeredAt = dados.answeredAt ? new Date(dados.answeredAt) : undefined;

    // P0 Zero Fake Success: gravação somente com URL real válida. Proibido mock/fake mp3
    const validRecordingUrl = dados.gravacaoUrl && !dados.gravacaoUrl.includes('simulada') && !dados.gravacaoUrl.includes('demo')
      ? dados.gravacaoUrl
      : null;

    const nova: ChamadaRecord = {
      ...dados,
      id,
      instanceId: actor.instanceId,
      gravacaoUrl: validRecordingUrl,
      operadorId: actor.userId,
      operadorNome: actor.name
    };

    if (isDbConnected()) {
      try {
        await db.insert(callsTable).values({
          id: nova.id,
          instanceId: actor.instanceId,
          providerCallId: nova.providerCallId,
          asteriskChannelId: nova.asteriskChannelId,
          ramal: nova.ramalOrigem,
          origem: nova.ramalOrigem,
          destino: nova.numeroDestino,
          contatoId: nova.contatoId,
          direcao: nova.direcao,
          status: nova.status,
          duracaoSegundos: nova.duracaoSegundos,
          startedAt,
          answeredAt,
          endedAt,
          recordingUrl: validRecordingUrl,
          notasOperador: nova.notasOperador,
          operadorId: actor.userId,
          operadorNome: actor.name
        });
      } catch (err: any) {
        if (env.NODE_ENV === 'production') {
          throw new Error(`Falha ao persistir registro de chamada no PostgreSQL: ${err.message}`);
        }
      }
    } else if (env.NODE_ENV === 'production') {
      throw new Error('PostgreSQL obrigatório em produção. Registro de chamada rejeitado.');
    } else {
      const list = this.fallbackStore.get(actor.instanceId) || [];
      list.unshift(nova);
      this.fallbackStore.set(actor.instanceId, list);
    }

    // Auditoria obrigatória de registro de chamada
    await auditoriaService.logEvent({
      instanceId: actor.instanceId,
      actorId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'TELEFONIA_REGISTRO_CHAMADA',
      entityType: 'LEAD',
      entityId: nova.contatoId || nova.numeroDestino,
      details: `Chamada ${nova.direcao} (${nova.status}) registrada para ${nova.numeroDestino} por ${actor.name}. Duração: ${nova.duracaoSegundos}s.`,
      dadosPosteriores: {
        chamadaId: nova.id,
        providerCallId: nova.providerCallId,
        duracao: nova.duracaoSegundos,
        status: nova.status
      }
    });

    return nova;
  }

  private mapToDomain(row: CallDb): ChamadaRecord {
    return {
      id: row.id,
      instanceId: row.instanceId,
      providerCallId: row.providerCallId || undefined,
      asteriskChannelId: row.asteriskChannelId || undefined,
      ramalOrigem: row.ramal,
      numeroDestino: row.destino,
      contatoId: row.contatoId || undefined,
      direcao: row.direcao as any,
      status: row.status as any,
      duracaoSegundos: row.duracaoSegundos,
      iniciadaEm: row.startedAt.toISOString(),
      answeredAt: row.answeredAt?.toISOString(),
      finalizadaEm: row.endedAt?.toISOString(),
      gravacaoUrl: row.recordingUrl,
      notasOperador: row.notasOperador || undefined,
      operadorId: row.operadorId || '',
      operadorNome: row.operadorNome || ''
    };
  }
}

export const telefoniaService = new TelefoniaService();
