export interface SgpClienteSync {
  cpfCnpj: string;
  nome: string;
  statusConexao: 'ONLINE' | 'OFFLINE' | 'BLOQUEADO' | 'NAO_ENCONTRADO';
  loginPppoe?: string;
  ipAtual?: string;
  planoContratado?: string;
  faturasAbertas?: number;
}

export interface ISgpAdapter {
  nome: string;
  isConfigurado(): boolean;
  consultarCliente(cpfCnpj: string): Promise<SgpClienteSync>;
  desbloquearConfianca(loginPppoe: string): Promise<{ sucesso: boolean; mensagem: string }>;
}
