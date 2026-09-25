// =============================================================================
// ENLACE TELECOM CRM — PAYMENT PROVIDER INTERFACE (P0.22)
// Arquitetura desacoplada para Enlace-Pay e Gateways de Cobrança (Pix / Boletos)
// =============================================================================

export type PaymentExecutionMode = 'MOCK_SANDBOX' | 'GATEWAY_PRODUCAO';
export type ChargePaymentStatus = 'PENDENTE' | 'PAGO' | 'EXPIRADO' | 'CANCELADO' | 'ESTORNADO';

export interface PixCobrancaPayload {
  valor: number;
  cpfCnpj: string;
  nomeCliente: string;
  descricao: string;
  faturaId: string;
  idempotencyKey?: string;
}

export interface PixCobrancaResult {
  modoExecucao: PaymentExecutionMode;
  copiaECola: string;
  txId: string;
  valor: number;
  expiracaoMinutos: number;
  chavePix: string;
  status: ChargePaymentStatus;
}

export interface IPaymentProvider {
  readonly modo: PaymentExecutionMode;
  isConfigurado(): boolean;
  createCharge(payload: PixCobrancaPayload): Promise<PixCobrancaResult>;
  getCharge(txId: string): Promise<{ txId: string; status: ChargePaymentStatus; valor: number }>;
  cancelCharge(txId: string): Promise<{ cancelado: boolean }>;
  refundCharge(txId: string, valor?: number): Promise<{ estornado: boolean }>;
  processWebhook(payload: any, signature?: string): Promise<{ liquidado: boolean; txId?: string; valorPago?: number }>;
  reconcile(txId: string): Promise<{ conciliado: boolean; status: ChargePaymentStatus }>;
}

export interface IPaymentsAdapter extends IPaymentProvider {
  gerarPixCobranca(payload: PixCobrancaPayload): Promise<PixCobrancaResult>;
}
