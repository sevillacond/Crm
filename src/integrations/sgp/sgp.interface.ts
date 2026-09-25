// =============================================================================
// ENLACE TELECOM CRM — SGP / ERP ADAPTER INTERFACE (P0.23)
// Abstração padronizada para IXC Soft, HubSoft, MK-AUTH e Voalle
// =============================================================================

export interface SgpClienteSync {
  cpfCnpj: string;
  nome: string;
  statusConexao: 'ONLINE' | 'OFFLINE' | 'BLOQUEADO' | 'NAO_ENCONTRADO';
  loginPppoe?: string;
  ipAtual?: string;
  planoContratado?: string;
  faturasAbertas?: number;
  contratoId?: string;
}

export interface ISgpAdapter {
  readonly nome: string;
  readonly status: 'MOCK' | 'ADAPTER_PARTIAL' | 'REAL';
  isConfigurado(): boolean;
  healthCheck(): Promise<{ ok: boolean; latencyMs?: number; message?: string }>;
  consultarCliente(cpfCnpj: string): Promise<SgpClienteSync>;
  desbloquearConfianca(loginPppoe: string): Promise<{ sucesso: boolean; mensagem: string }>;
}
