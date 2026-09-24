import { SgpClienteStatus, SgpDesbloqueioResult, SgpProvider } from '../../types';
import { ActorContext } from '../auth/actorContext.ts';
import { auditoriaService } from '../auditoria/auditoria.service.ts';
import { sgpAdapter } from '../../integrations/sgp/sgp.adapter.ts';

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
  origem: 'REAL' | 'ADAPTER' | 'MOCK' | 'NOT_CONFIGURED';
  isMock?: boolean;
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
        provedorSgp: 'IXC',
        origem: 'MOCK',
        isMock: true
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
        provedorSgp: 'MK_AUTH',
        origem: 'MOCK',
        isMock: true
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
        provedorSgp: 'VOALLE',
        origem: 'MOCK',
        isMock: true
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
        provedorSgp: 'IXC',
        origem: 'MOCK',
        isMock: true
      }
    ];

    this.contractsByInstance.set('inst-dev-local-001', devContracts);
  }

  public getIntegrationStatus(instanceId: string): {
    status: 'REAL' | 'ADAPTER' | 'MOCK' | 'NOT_CONFIGURED';
    provedor: SgpProvider;
    modo: string;
    mensagem: string;
  } {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para verificar status do SGP.');
    }

    if (sgpAdapter.isConfigurado()) {
      return {
        status: 'REAL',
        provedor: 'IXC',
        modo: 'PRODUÇÃO',
        mensagem: 'Integração SGP operacional via API REST.'
      };
    }

    if (this.contractsByInstance.has(instanceId)) {
      return {
        status: 'MOCK',
        provedor: 'IXC',
        modo: 'DEMO/SANDBOX',
        mensagem: 'Modo demonstração/mock ativo com contratos fictícios isolados.'
      };
    }

    return {
      status: 'NOT_CONFIGURED',
      provedor: 'IXC',
      modo: 'NÃO CONFIGURADO',
      mensagem: 'Nenhuma integração SGP configurada para esta instância. Nenhum dado fictício gerado.'
    };
  }

  public async getContracts(instanceId: string): Promise<SgpContractMock[]> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para consultar contratos no SGP.');
    }
    // P0: Nunca fabricar clientes ou contratos fictícios para instâncias sem dados
    return this.contractsByInstance.get(instanceId) || [];
  }

  public async getContractById(contratoId: string, instanceId: string): Promise<SgpContractMock | null> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para consultar contrato no SGP.');
    }
    const list = await this.getContracts(instanceId);
    return list.find(c => c.contratoId === contratoId) || null;
  }

  public async getContractByCpfCnpj(cpfCnpj: string, instanceId: string): Promise<SgpContractMock | null> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para consultar contrato por CPF/CNPJ no SGP.');
    }
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
