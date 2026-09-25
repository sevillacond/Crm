// =============================================================================
// ENLACE TELECOM CRM — PAYMENT PROVIDER INTERFACE (P0/P1)
// Arquitetura desacoplada para Enlace-Pay e Gateways de Cobrança (Pix / Boletos)
// Sem fake success: estados rigorosos de homologação e produção
// =============================================================================

export type PaymentExecutionMode = 'MOCK_SANDBOX' | 'GATEWAY_PRODUCAO';

export type PaymentProviderStatus =
  | 'NOT_CONFIGURED'
  | 'MOCK'
  | 'STUB'
  | 'ADAPTER'
  | 'ADAPTER_PARTIAL'
  | 'CONNECTED'
  | 'PRODUCTION'
  | 'ERROR';

export type ChargePaymentStatus = 'PENDENTE' | 'PAGO' | 'EXPIRADO' | 'CANCELADO' | 'ESTORNADO';

export interface PixCobrancaPayload {
  valor: number;
  cpfCnpj: string;
  nomeCliente: string;
  descricao: string;
  faturaId: string;
  contatoId?: string;
  dealId?: string;
  instanceId?: string;
  idempotencyKey?: string;
}

export interface PixCobrancaResult {
  modoExecucao: PaymentExecutionMode;
  statusIntegracao: PaymentProviderStatus;
  copiaECola: string;
  txId: string;
  valor: number;
  expiracaoMinutos: number;
  chavePix: string;
  status: ChargePaymentStatus;
  aviso?: string;
}

export interface IPaymentProvider {
  readonly status: PaymentProviderStatus;
  readonly modo: PaymentExecutionMode;
  isConfigurado(): boolean;
  createCharge(payload: PixCobrancaPayload): Promise<PixCobrancaResult>;
  getCharge(txId: string): Promise<{ txId: string; status: ChargePaymentStatus; valor: number; statusIntegracao: PaymentProviderStatus }>;
  cancelCharge(txId: string): Promise<{ cancelado: boolean; statusIntegracao: PaymentProviderStatus; motivo?: string }>;
  refundCharge(txId: string, valor?: number): Promise<{ estornado: boolean; statusIntegracao: PaymentProviderStatus; motivo?: string }>;
  processWebhook(payload: any, signature?: string, timestamp?: string): Promise<{ liquidado: boolean; txId?: string; valorPago?: number; idempotencyKey?: string; erro?: string }>;
  reconcile(txId: string): Promise<{ conciliado: boolean; status: ChargePaymentStatus; statusIntegracao: PaymentProviderStatus }>;
}

export interface IPaymentsAdapter extends IPaymentProvider {
  gerarPixCobranca(payload: PixCobrancaPayload): Promise<PixCobrancaResult>;
}
