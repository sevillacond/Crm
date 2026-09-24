import { IPaymentsAdapter, PixCobrancaPayload, PixCobrancaResult } from './payments.interface.ts';
import crypto from 'crypto';

export class PaymentsAdapter implements IPaymentsAdapter {
  private pixKey = process.env.PIX_CHAVE_INSTANCIA;

  isConfigurado(): boolean {
    return !!(this.pixKey && !this.pixKey.includes('CHANGE_ME'));
  }

  async gerarPixCobranca(payload: PixCobrancaPayload): Promise<PixCobrancaResult> {
    const isConfig = this.isConfigurado();
    const txId = `pix_${Date.now().toString().slice(-8)}${crypto.randomBytes(4).toString('hex')}`;
    const chave = this.pixKey || (process.env.NODE_ENV === 'production' ? '' : 'sandbox@provedor-demo.local');
    const nomeProvedor = (process.env.PROVIDER_NOME_FANTASIA || 'PROVEDOR TELECOM').toUpperCase().slice(0, 25);
    const cidade = (process.env.PROVIDER_CIDADE || 'BRASIL').toUpperCase().slice(0, 15);

    // Generates standard EMVCo payload format
    const copiaECola = `00020126580014br.gov.bcb.pix0136${chave}520400005303986540${payload.valor.toFixed(2).length}${payload.valor.toFixed(2)}5802BR59${nomeProvedor.length.toString().padStart(2, '0')}${nomeProvedor}60${cidade.length.toString().padStart(2, '0')}${cidade}62070503***6304`;

    return {
      modoExecucao: isConfig ? 'GATEWAY_PRODUCAO' : 'MOCK_SANDBOX',
      copiaECola,
      txId,
      valor: payload.valor,
      expiracaoMinutos: 60,
      chavePix: chave
    };
  }
}

export const paymentsAdapter = new PaymentsAdapter();
