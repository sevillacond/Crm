import { ActorContext } from '../auth/actorContext.ts';
import { auditoriaService } from '../auditoria/auditoria.service.ts';

export interface ChamadaRecord {
  id: string;
  instanceId: string;
  ramalOrigem: string;
  numeroDestino: string;
  nomeContato?: string;
  contatoId?: string;
  direcao: 'ENTRANTE' | 'SAINTE';
  status: 'ATENDIDA' | 'NAO_ATENDIDA' | 'OCUPADO' | 'FALHA';
  duracaoSegundos: number;
  iniciadaEm: string;
  finalizadaEm?: string;
  gravacaoUrl?: string;
  notasOperador?: string;
  operadorId: string;
  operadorNome: string;
}

class TelefoniaService {
  private chamadasByInstance = new Map<string, ChamadaRecord[]>();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
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
        gravacaoUrl: 'https://telecom.enlace.local/recordings/call-001.mp3',
        notasOperador: 'Cliente confirmou recepção da fatura e solicitou esclarecimento sobre plano Fibra 600.',
        operadorId: 'usr_admin',
        operadorNome: 'Admin Enlace'
      },
      {
        id: 'CALL-2026-002',
        instanceId: 'inst-dev-local-001',
        ramalOrigem: '1002 (Vendas)',
        numeroDestino: '(11) 97711-2233',
        nomeContato: 'Dra. Camila Siqueira',
        contatoId: 'c2',
        direcao: 'ENTRANTE',
        status: 'ATENDIDA',
        duracaoSegundos: 285,
        iniciadaEm: new Date(Date.now() - 7200000).toISOString(),
        finalizadaEm: new Date(Date.now() - 6915000).toISOString(),
        gravacaoUrl: 'https://telecom.enlace.local/recordings/call-002.mp3',
        notasOperador: 'Dúvidas sobre o prazo de instalação da fibra dedicada.',
        operadorId: 'usr_atendente',
        operadorNome: 'Juliana Paes'
      },
      {
        id: 'CALL-2026-003',
        instanceId: 'inst-dev-local-001',
        ramalOrigem: '1004 (Fila Suporte)',
        numeroDestino: '(11) 96543-2109',
        nomeContato: 'Carlos Eduardo Nogueira',
        contatoId: 'c3',
        direcao: 'SAINTE',
        status: 'NAO_ATENDIDA',
        duracaoSegundos: 0,
        iniciadaEm: new Date(Date.now() - 14400000).toISOString(),
        operadorId: 'usr_admin',
        operadorNome: 'Admin Enlace'
      }
    ];

    this.chamadasByInstance.set('inst-dev-local-001', devChamadas);
  }

  public async getChamadas(instanceId: string): Promise<ChamadaRecord[]> {
    if (!instanceId) return [];
    if (!this.chamadasByInstance.has(instanceId)) {
      this.chamadasByInstance.set(instanceId, []);
    }
    return this.chamadasByInstance.get(instanceId) || [];
  }

  public async registrarChamada(
    dados: Omit<ChamadaRecord, 'id' | 'instanceId' | 'operadorId' | 'operadorNome'>,
    actor: ActorContext
  ): Promise<ChamadaRecord> {
    if (!actor || !actor.instanceId) {
      throw new Error('Instância ou autorização ausente.');
    }

    const nova: ChamadaRecord = {
      ...dados,
      id: `CALL-${Date.now()}`,
      instanceId: actor.instanceId,
      operadorId: actor.userId,
      operadorNome: actor.name
    };

    const lista = await this.getChamadas(actor.instanceId);
    lista.unshift(nova);
    this.chamadasByInstance.set(actor.instanceId, lista);

    // Auditoria de chamada telefônica registrada
    await auditoriaService.logEvent({
      instanceId: actor.instanceId,
      actorId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'TELEFONIA_REGISTRO_CHAMADA',
      entityType: 'LEAD',
      entityId: nova.contatoId || nova.numeroDestino,
      details: `Chamada ${nova.direcao} (${nova.status}) registrada para ${nova.numeroDestino} por ${actor.name}. Duração: ${nova.duracaoSegundos}s.`,
      dadosPosteriores: { chamadaId: nova.id, duracao: nova.duracaoSegundos, status: nova.status }
    });

    return nova;
  }
}

export const telefoniaService = new TelefoniaService();
