import { SgpClienteStatus, SgpDesbloqueioResult, SgpProvider } from '../../types';
import { ActorContext } from '../auth/actorContext.ts';
import { auditoriaService } from '../auditoria/auditoria.service.ts';

export interface SgpContractMock {
  contratoId: string;
  clienteId: string;
  nomeCliente: string;
  cpfCnpj: string;
  planoContratado: string;
  statusConexao: 'CONECTADO' | 'DESCONECTADO' | 'BLOQUEADO' | 'REDUZIDO';
  ipPppoe?: string;
  macOnt?: string;
  sinalRxDbm?: number;
  uptimeHoras?: number;
  faturasAbertas: number;
  diasInadimplente: number;
  desbloqueioConfiancaDisponivel: boolean;
  ultimoDesbloqueioConfianca?: string;
  provedorSgp: SgpProvider;
}

class SgpService {
  // Mock store de contratos por instância
  private contractsByInstance = new Map<string, SgpContractMock[]>();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const devContracts: SgpContractMock[] = [
      {
        contratoId: 'CTR-IXC-8821',
        clienteId: 'CLI-001',
        nomeCliente: 'Ana Silva Santos',
        cpfCnpj: '123.456.789-00',
        planoContratado: 'Fibra Residencial 600 Mega',
        statusConexao: 'CONECTADO',
        ipPppoe: '100.64.45.12',
        macOnt: '48:8F:5A:12:FE:AA',
        sinalRxDbm: -19.4,
        uptimeHoras: 142,
        faturasAbertas: 0,
        diasInadimplente: 0,
        desbloqueioConfiancaDisponivel: false,
        provedorSgp: 'IXC'
      },
      {
        contratoId: 'CTR-MK-4412',
        clienteId: 'CLI-002',
        nomeCliente: 'Bruno Almeida Costa',
        cpfCnpj: '234.567.890-11',
        planoContratado: 'Gamer Pro 800 Mega',
        statusConexao: 'BLOQUEADO',
        ipPppoe: '100.64.88.90',
        macOnt: '60:32:B1:44:09:1C',
        sinalRxDbm: -22.1,
        uptimeHoras: 0,
        faturasAbertas: 1,
        diasInadimplente: 12,
        desbloqueioConfiancaDisponivel: true,
        provedorSgp: 'MK_AUTH'
      },
      {
        contratoId: 'CTR-VOA-1092',
        clienteId: 'CLI-003',
        nomeCliente: 'Carla Mendonça Ramos',
        cpfCnpj: '345.678.901-22',
        planoContratado: 'Comercial Dedicado 1 Giga',
        statusConexao: 'CONECTADO',
        ipPppoe: '187.55.120.4',
        macOnt: 'E0:67:B3:98:AA:11',
        sinalRxDbm: -18.2,
        uptimeHoras: 720,
        faturasAbertas: 0,
        diasInadimplente: 0,
        desbloqueioConfiancaDisponivel: false,
        provedorSgp: 'VOALLE'
      },
      {
        contratoId: 'CTR-IXC-9930',
        clienteId: 'CLI-004',
        nomeCliente: 'Diego Fernandes',
        cpfCnpj: '456.789.012-33',
        planoContratado: 'Fibra Ultra 400 Mega',
        statusConexao: 'REDUZIDO',
        ipPppoe: '100.64.12.87',
        macOnt: 'A4:91:B1:00:22:98',
        sinalRxDbm: -26.8, // Sinal atenuado
        uptimeHoras: 48,
        faturasAbertas: 1,
        diasInadimplente: 7,
        desbloqueioConfiancaDisponivel: true,
        provedorSgp: 'IXC'
      }
    ];

    this.contractsByInstance.set('inst-dev-local-001', devContracts);
    this.contractsByInstance.set('inst-enlace-fibra-001', devContracts);
  }

  public async getContracts(instanceId: string): Promise<SgpContractMock[]> {
    if (!instanceId) return [];
    if (!this.contractsByInstance.has(instanceId)) {
      // Clona lista base inicial para nova instância
      this.contractsByInstance.set(instanceId, [
        {
          contratoId: `CTR-${instanceId.slice(0, 4)}-01`,
          clienteId: 'CLI-LOCAL-01',
          nomeCliente: 'Cliente Exemplo Provedor',
          cpfCnpj: '000.111.222-33',
          planoContratado: 'Fibra 500 Mega',
          statusConexao: 'CONECTADO',
          ipPppoe: '100.64.1.10',
          macOnt: '50:C7:BF:00:11:22',
          sinalRxDbm: -19.8,
          uptimeHoras: 24,
          faturasAbertas: 0,
          diasInadimplente: 0,
          desbloqueioConfiancaDisponivel: false,
          provedorSgp: 'IXC'
        }
      ]);
    }
    return this.contractsByInstance.get(instanceId) || [];
  }

  public async getContractById(contratoId: string, instanceId: string): Promise<SgpContractMock | null> {
    const list = await this.getContracts(instanceId);
    return list.find(c => c.contratoId === contratoId) || null;
  }

  public async getContractByCpfCnpj(cpfCnpj: string, instanceId: string): Promise<SgpContractMock | null> {
    const normalized = cpfCnpj.replace(/\D/g, '');
    const list = await this.getContracts(instanceId);
    return list.find(c => c.cpfCnpj.replace(/\D/g, '') === normalized) || null;
  }

  public async desbloqueioConfianca(
    contratoId: string,
    actor: ActorContext
  ): Promise<SgpDesbloqueioResult> {
    if (!actor || !actor.instanceId) {
      throw new Error('Contexto de autorização ou instanceId ausente.');
    }

    const list = await this.getContracts(actor.instanceId);
    const contract = list.find(c => c.contratoId === contratoId);

    if (!contract) {
      throw new Error(`Contrato ${contratoId} não localizado na instância.`);
    }

    if (!contract.desbloqueioConfiancaDisponivel) {
      throw new Error('Desbloqueio em confiança não permitido para este contrato ou já utilizado no ciclo atual.');
    }

    const statusAnterior = contract.statusConexao;
    contract.statusConexao = 'CONECTADO';
    contract.desbloqueioConfiancaDisponivel = false;
    contract.ultimoDesbloqueioConfianca = new Date().toISOString();

    const protocolo = `DESB-${Date.now().toString().slice(-6)}`;
    const expiraEm = new Date(Date.now() + 48 * 3600 * 1000).toISOString(); // 48 horas

    // Auditoria obrigatória do desbloqueio
    await auditoriaService.logEvent({
      instanceId: actor.instanceId,
      actorId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'SGP_DESBLOQUEIO_CONFIANCA',
      entityType: 'CONFIG',
      entityId: contratoId,
      details: `Desbloqueio em confiança realizado para ${contract.nomeCliente} (${contratoId}) via ${contract.provedorSgp}. Protocolo: ${protocolo}. Validade: 48h.`,
      dadosAnteriores: { statusConexao: statusAnterior, desbloqueioConfiancaDisponivel: true },
      dadosPosteriores: { statusConexao: 'CONECTADO', protocolo, expiraEm, desbloqueioConfiancaDisponivel: false },
      isMaiaAction: !!actor.isMaia
    });

    return {
      sucesso: true,
      contratoId,
      statusAnterior,
      novoStatus: 'CONECTADO',
      protocolo,
      expiraEm,
      mensagem: `Acesso desbloqueado temporariamente por 48 horas no provedor ${contract.provedorSgp}. Protocolo: ${protocolo}.`
    };
  }

  public async pingOnt(contratoId: string, instanceId: string) {
    const contract = await this.getContractById(contratoId, instanceId);
    if (!contract) {
      throw new Error('Contrato não encontrado.');
    }

    return {
      contratoId,
      macOnt: contract.macOnt,
      ipPppoe: contract.ipPppoe,
      online: contract.statusConexao === 'CONECTADO',
      latenciaMs: contract.statusConexao === 'CONECTADO' ? (Math.random() * 8 + 3).toFixed(1) : null,
      perdaPacotes: contract.statusConexao === 'CONECTADO' ? '0%' : '100%',
      potenciaRxDbm: contract.sinalRxDbm,
      qualidadeOptica: (contract.sinalRxDbm && contract.sinalRxDbm > -24) ? 'EXCELENTE' : 'ATENCAO'
    };
  }
}

export const sgpService = new SgpService();
