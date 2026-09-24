export type Role = 'ADMIN' | 'SUPERVISOR' | 'ATENDENTE' | 'TECNICO' | 'MAIA_AGENT';

export interface User {
  id: string;
  instanceId: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  department: string;
  status: 'ONLINE' | 'EM_ATENDIMENTO' | 'PAUSA' | 'OFFLINE';
}

export interface InstanceConfig {
  instanceId: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  cidadeSede: string;
  uf: string;
  timezone: string;
  status: 'ISOLADA_ATIVA' | 'EM_MANUTENCAO';
  databaseEngine: 'PostgreSQL 16.2 (Dedicado)' | 'PostgreSQL 15 (Isolado)';
  sgpIntegrado: 'MK-AUTH' | 'IXC Soft' | 'SGP Provedor' | 'Nenhum';
  totalCtos: number;
  totalPortasDisponiveis: number;
  versaoMaia: string;
  maiaNivelAutonomia?: number;
}

export interface Plano {
  id: string;
  nome: string;
  downloadMbps: number;
  uploadMbps: number;
  precoMensal: number;
  adesao: number;
  tecnologia: 'FTTH (Fibra Óptica)' | 'Link Dedicado' | 'Rádio 5GHz';
  popular?: boolean;
  recursos: string[];
}

export type ContatoStatus = 'NOVO' | 'EM_QUALIFICACAO' | 'VIAVEL' | 'INVIAVEL' | 'CLIENTE_ATIVO' | 'CANCELADO';

export interface Contato {
  id: string;
  nome: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  status: ContatoStatus;
  tags: string[];
  scoreMaia?: number; // 0 - 100
  resumoMaia?: string;
  origem: 'WHATSAPP' | 'WEBCHAT' | 'SITE' | 'INDICACAO' | 'CAMPANHA';
  dataCadastro: string;
  ultimoContato?: string;
}

export type DealEtapa = 
  | 'NOVO_LEAD'
  | 'VIABILIDADE'
  | 'PROPOSTA'
  | 'NEGOCIACAO'
  | 'INSTALACAO'
  | 'GANHO'
  | 'PERDIDO';

export type ViabilidadeStatus = 'PENDENTE' | 'VIAVEL_CTO' | 'INVIAVEL' | 'EXPANSAO_NECESSARIA';

export interface Deal {
  id: string;
  titulo: string;
  contatoId: string;
  planoId: string;
  etapa: DealEtapa;
  valorMensal: number;
  taxaAdesao: number;
  probabilidade: number; // 0 - 100%
  dataPrevisao: string;
  responsavelId: string;
  statusViabilidade: ViabilidadeStatus;
  ctoProxima?: string;
  distanciaMetros?: number;
  motivoPerda?: string;
  notas: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  entityType: 'DEAL' | 'CONTATO' | 'CONFIG' | 'AUTH' | 'VIABILIDADE' | 'MAIA_TOOL';
  entityId: string;
  details: string;
  isMaiaAction: boolean;
}

export interface ViabilidadeConsulta {
  cep: string;
  numero: string;
  bairro?: string;
  viavel: boolean;
  ctoId?: string;
  distanciaMetros?: number;
  portasLivres?: number;
  tecnologiaDisponivel: string;
  observacao: string;
}

export interface MaiaPromptResponse {
  resposta: string;
  toolExecutada?: string;
  parametrosTool?: Record<string, any>;
  sugestaoPlano?: string;
  scoreQualificacao?: number;
  auditId?: string;
}

export type OSTipo = 'INSTALACAO' | 'MUDANCA_ENDERECO' | 'UPGRADE_PLANO' | 'REPARO_FIBRA' | 'RETIRADA';
export type OSStatus = 'AGENDADA' | 'A_CAMINHO' | 'EM_EXECUCAO' | 'CONCLUIDA' | 'CANCELADA';

export interface OrdemServico {
  id: string;
  dealId?: string;
  contatoId: string;
  clienteNome: string;
  telefone: string;
  endereco: string;
  bairro: string;
  tipo: OSTipo;
  status: OSStatus;
  planoNome: string;
  tecnicoId: string;
  tecnicoNome: string;
  dataAgendada: string;
  periodo: 'MANHA' | 'TARDE' | 'INTEGRAL';
  ctoDesignada: string;
  portaCto: number;
  sinalOpticoDbm?: number; // ex: -21.4 dBm
  metragemDropMetros?: number;
  ontSerialGpon?: string;
  roteadorWifi6Serial?: string;
  checklist: {
    passagemDrop: boolean;
    conectorizacaoFusao: boolean;
    testePotenciaOptica: boolean;
    provisionamentoOLT: boolean;
    speedtestValido: boolean;
    assinaturaCliente: boolean;
  };
  observacoes?: string;
}

export type SgpProvider = 'IXC' | 'MK_AUTH' | 'VOALLE';

export interface SgpClienteStatus {
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

export interface SgpDesbloqueioResult {
  sucesso: boolean;
  contratoId: string;
  statusAnterior: string;
  novoStatus: string;
  protocolo: string;
  expiraEm: string;
  mensagem: string;
}

