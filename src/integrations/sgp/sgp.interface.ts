// =============================================================================
// ENLACE TELECOM CRM — SGP / ERP ADAPTER INTERFACE (P0/P1)
// Abstração padronizada para IXC Soft, HubSoft, MK-AUTH e Voalle
// Zero Fake Success: Estados explícitos de conectividade e falhas
// =============================================================================

export type SgpConnectionStatus =
  | 'ONLINE'
  | 'OFFLINE'
  | 'BLOQUEADO'
  | 'NAO_ENCONTRADO'
  | 'UNAUTHORIZED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'CONNECTED'
  | 'NOT_CONFIGURED';

export type SgpAdapterStatus =
  | 'MOCK'
  | 'STUB'
  | 'ADAPTER_PARTIAL'
  | 'CONNECTED'
  | 'REAL'
  | 'NOT_CONFIGURED'
  | 'ERROR';

export interface SgpClienteSync {
  cpfCnpj: string;
  nome: string;
  statusConexao: SgpConnectionStatus;
  loginPppoe?: string;
  ipAtual?: string;
  planoContratado?: string;
  faturasAbertas?: number;
  contratoId?: string;
}

export interface ISgpAdapter {
  readonly nome: string;
  readonly status: SgpAdapterStatus;
  isConfigurado(): boolean;
  healthCheck(): Promise<{ ok: boolean; latencyMs?: number; message?: string; statusIntegracao?: string }>;
  consultarCliente(cpfCnpj: string): Promise<SgpClienteSync>;
  desbloquearConfianca(loginPppoe: string): Promise<{ sucesso: boolean; mensagem: string; statusIntegracao?: string }>;
}
