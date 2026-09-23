export interface PixCobrancaPayload {
  valor: number;
  cpfCnpj: string;
  nomeCliente: string;
  descricao: string;
  faturaId: string;
}

export interface PixCobrancaResult {
  modoExecucao: 'MOCK_SANDBOX' | 'GATEWAY_PRODUCAO';
  copiaECola: string;
  txId: string;
  valor: number;
  expiracaoMinutos: number;
  chavePix: string;
}

export interface IPaymentsAdapter {
  isConfigurado(): boolean;
  gerarPixCobranca(payload: PixCobrancaPayload): Promise<PixCobrancaResult>;
}
