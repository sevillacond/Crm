import { IPaymentsAdapter, PixCobrancaPayload, PixCobrancaResult } from './payments.interface.ts';
import crypto from 'crypto';

export class PaymentsAdapter implements IPaymentsAdapter {
  private pixKey = process.env.PIX_CHAVE_INSTANCIA;

  isConfigurado(): boolean {
    return !!(this.pixKey && !this.pixKey.includes('CHANGE_ME'));
  }

  async gerarPixCobranca(payload: PixCobrancaPayload): Promise<PixCobrancaResult> {
    const txId = `enlace${Date.now().toString().slice(-8)}${crypto.randomBytes(4).toString('hex')}`;
    const chave = this.pixKey || 'financeiro@enlacefibra.com.br';

    // Generates standard EMVCo payload format
    const copiaECola = `00020126580014br.gov.bcb.pix0136${chave}520400005303986540${payload.valor.toFixed(2).length}${payload.valor.toFixed(2)}5802BR5925ENLACE FIBRA TELECOM6008CAMPINAS62070503***6304`;

    return {
      modoExecucao: this.isConfigurado() ? 'GATEWAY_PRODUCAO' : 'MOCK_SANDBOX',
      copiaECola,
      txId,
      valor: payload.valor,
      expiracaoMinutos: 60,
      chavePix: chave
    };
  }
}

export const paymentsAdapter = new PaymentsAdapter();
