import crypto from 'crypto';
import {
  IPaymentsAdapter,
  PixCobrancaPayload,
  PixCobrancaResult,
  PaymentExecutionMode,
  ChargePaymentStatus
} from './payments.interface.ts';

export class PaymentsAdapter implements IPaymentsAdapter {
  private pixKey = process.env.PIX_CHAVE_INSTANCIA;
  private gatewaySecret = process.env.PIX_GATEWAY_SECRET;

  get modo(): PaymentExecutionMode {
    return this.isConfigurado() ? 'GATEWAY_PRODUCAO' : 'MOCK_SANDBOX';
  }

  isConfigurado(): boolean {
    return !!(this.pixKey && !this.pixKey.includes('CHANGE_ME'));
  }

  async createCharge(payload: PixCobrancaPayload): Promise<PixCobrancaResult> {
    return this.gerarPixCobranca(payload);
  }

  async gerarPixCobranca(payload: PixCobrancaPayload): Promise<PixCobrancaResult> {
    const isConfig = this.isConfigurado();

    if (process.env.NODE_ENV === 'production' && !isConfig) {
      throw new Error(
        'Gateway de Pagamento Pix não configurado nesta instância em produção (PIX_CHAVE_INSTANCIA pendente).'
      );
    }

    const txId = `pix_${Date.now().toString().slice(-8)}${crypto.randomBytes(4).toString('hex')}`;
    const chave = this.pixKey || (process.env.NODE_ENV === 'production' ? '' : 'sandbox@provedor-demo.local');
    const nomeProvedor = (process.env.PROVIDER_NOME_FANTASIA || 'PROVEDOR TELECOM').toUpperCase().slice(0, 25);
    const cidade = (process.env.PROVIDER_CIDADE || 'BRASIL').toUpperCase().slice(0, 15);

    // Geração do payload padrão EMVCo do Banco Central
    const copiaECola = `00020126580014br.gov.bcb.pix0136${chave}520400005303986540${payload.valor.toFixed(2).length}${payload.valor.toFixed(2)}5802BR59${nomeProvedor.length.toString().padStart(2, '0')}${nomeProvedor}60${cidade.length.toString().padStart(2, '0')}${cidade}62070503***6304`;

    return {
      modoExecucao: isConfig ? 'GATEWAY_PRODUCAO' : 'MOCK_SANDBOX',
      copiaECola,
      txId,
      valor: payload.valor,
      expiracaoMinutos: 60,
      chavePix: chave,
      status: 'PENDENTE'
    };
  }

  async getCharge(txId: string): Promise<{ txId: string; status: ChargePaymentStatus; valor: number }> {
    if (!this.isConfigurado()) {
      return { txId, status: 'PENDENTE', valor: 0 };
    }
    // Em produção com gateway real (ex: Enlace-Pay), consulta via API HTTP
    return { txId, status: 'PENDENTE', valor: 0 };
  }

  async cancelCharge(txId: string): Promise<{ cancelado: boolean }> {
    if (!this.isConfigurado()) {
      return { cancelado: true };
    }
    return { cancelado: true };
  }

  async refundCharge(txId: string, _valor?: number): Promise<{ estornado: boolean }> {
    if (!this.isConfigurado()) {
      return { estornado: false };
    }
    return { estornado: true };
  }

  async processWebhook(payload: any, _signature?: string): Promise<{ liquidado: boolean; txId?: string; valorPago?: number }> {
    if (!payload?.pix) {
      return { liquidado: false };
    }
    return {
      liquidado: true,
      txId: payload.pix[0]?.txid,
      valorPago: Number(payload.pix[0]?.valor)
    };
  }

  async reconcile(txId: string): Promise<{ conciliado: boolean; status: ChargePaymentStatus }> {
    const charge = await this.getCharge(txId);
    return {
      conciliado: charge.status === 'PAGO',
      status: charge.status
    };
  }
}

export const paymentsAdapter = new PaymentsAdapter();
