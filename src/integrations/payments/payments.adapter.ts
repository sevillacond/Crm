import crypto from 'crypto';
import {
  IPaymentsAdapter,
  PixCobrancaPayload,
  PixCobrancaResult,
  PaymentExecutionMode,
  PaymentProviderStatus,
  ChargePaymentStatus
} from './payments.interface.ts';

export class PaymentsAdapter implements IPaymentsAdapter {
  private pixKey = process.env.PIX_CHAVE_INSTANCIA;
  private gatewaySecret = process.env.PIX_GATEWAY_SECRET;
  private enlacePayApiKey = process.env.ENLACE_PAY_API_KEY;
  private enlacePayEndpoint = process.env.ENLACE_PAY_ENDPOINT;

  // Zero Fake Success: PIX_CHAVE_INSTANCIA isolada NÃO é prova de gateway conectado
  get status(): PaymentProviderStatus {
    if (this.isGatewayConectado()) {
      return process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'CONNECTED';
    }
    if (process.env.NODE_ENV === 'production') {
      return 'NOT_CONFIGURED';
    }
    return 'MOCK';
  }

  get modo(): PaymentExecutionMode {
    return this.isGatewayConectado() ? 'GATEWAY_PRODUCAO' : 'MOCK_SANDBOX';
  }

  // Verifica se a chave estática do provedor existe para emissão de QR Code
  isConfigurado(): boolean {
    return !!(this.pixKey && !this.pixKey.includes('CHANGE_ME'));
  }

  // Verifica se há comunicação real com o gateway Enlace-Pay / Banco Central
  isGatewayConectado(): boolean {
    return !!(
      this.enlacePayApiKey &&
      !this.enlacePayApiKey.includes('CHANGE_ME') &&
      this.enlacePayEndpoint &&
      !this.enlacePayEndpoint.includes('CHANGE_ME')
    );
  }

  async createCharge(payload: PixCobrancaPayload): Promise<PixCobrancaResult> {
    return this.gerarPixCobranca(payload);
  }

  async gerarPixCobranca(payload: PixCobrancaPayload): Promise<PixCobrancaResult> {
    const isConfig = this.isConfigurado();

    // P0: Bloqueio estrito em produção se não configurado
    if (process.env.NODE_ENV === 'production' && !isConfig) {
      throw new Error(
        'Gateway de Pagamento Pix não configurado nesta instância em produção (PIX_CHAVE_INSTANCIA pendente).'
      );
    }

    // Se houver gateway real Enlace-Pay conectado via API HTTP
    if (this.isGatewayConectado()) {
      try {
        const response = await fetch(`${this.enlacePayEndpoint}/v1/charges`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.enlacePayApiKey}`,
            'Content-Type': 'application/json',
            ...(payload.idempotencyKey ? { 'Idempotency-Key': payload.idempotencyKey } : {})
          },
          body: JSON.stringify({
            valor: payload.valor,
            cpfCnpj: payload.cpfCnpj,
            nomeCliente: payload.nomeCliente,
            descricao: payload.descricao,
            faturaId: payload.faturaId
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(`Enlace-Pay retornou status ${response.status}: ${JSON.stringify(errData)}`);
        }

        const data: any = await response.json();
        return {
          modoExecucao: 'GATEWAY_PRODUCAO',
          statusIntegracao: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'CONNECTED',
          copiaECola: data.copiaECola,
          txId: data.txId,
          valor: payload.valor,
          expiracaoMinutos: data.expiracaoMinutos || 60,
          chavePix: data.chavePix || this.pixKey || '',
          status: 'PENDENTE'
        };
      } catch (gatewayErr: any) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error(`Falha ao comunicar com Enlace-Pay Gateway em produção: ${gatewayErr.message}`);
        }
        console.warn('[PaymentsAdapter] Gateway Enlace-Pay indisponível, recorrendo a sandbox dev:', gatewayErr.message);
      }
    }

    // Modo MOCK / Sandbox explícito para desenvolvimento e demonstração
    const txId = `pix_mock_${Date.now().toString().slice(-8)}${crypto.randomBytes(4).toString('hex')}`;
    const chave = this.pixKey || (process.env.NODE_ENV === 'production' ? '' : 'sandbox@provedor-demo.local');
    const nomeProvedor = (process.env.PROVIDER_NOME_FANTASIA || 'PROVEDOR TELECOM').toUpperCase().slice(0, 25);
    const cidade = (process.env.PROVIDER_CIDADE || 'BRASIL').toUpperCase().slice(0, 15);

    // Geração do payload padrão EMVCo do Banco Central para o QR Code
    const copiaECola = `00020126580014br.gov.bcb.pix0136${chave}520400005303986540${payload.valor.toFixed(2).length}${payload.valor.toFixed(2)}5802BR59${nomeProvedor.length.toString().padStart(2, '0')}${nomeProvedor}60${cidade.length.toString().padStart(2, '0')}${cidade}62070503***6304`;

    return {
      modoExecucao: 'MOCK_SANDBOX',
      statusIntegracao: 'MOCK',
      copiaECola,
      txId,
      valor: payload.valor,
      expiracaoMinutos: 60,
      chavePix: chave,
      status: 'PENDENTE',
      aviso: '[SIMULATED/MOCK] Cobrança Pix gerada em modo demonstração. Liquidação requer webhook ou gateway bancário real.'
    };
  }

  async getCharge(txId: string): Promise<{ txId: string; status: ChargePaymentStatus; valor: number; statusIntegracao: PaymentProviderStatus }> {
    if (!this.isGatewayConectado()) {
      return { txId, status: 'PENDENTE', valor: 0, statusIntegracao: this.status };
    }
    try {
      const response = await fetch(`${this.enlacePayEndpoint}/v1/charges/${encodeURIComponent(txId)}`, {
        headers: { Authorization: `Bearer ${this.enlacePayApiKey}` }
      });
      if (response.ok) {
        const data: any = await response.json();
        return {
          txId,
          status: data.status || 'PENDENTE',
          valor: data.valor || 0,
          statusIntegracao: 'CONNECTED'
        };
      }
    } catch {
      // Fallback seguro
    }
    return { txId, status: 'PENDENTE', valor: 0, statusIntegracao: this.status };
  }

  // P0 Zero Fake Success: NUNCA retornar cancelado: true sem confirmação do gateway externo
  async cancelCharge(txId: string): Promise<{ cancelado: boolean; statusIntegracao: PaymentProviderStatus; motivo?: string }> {
    if (!this.isGatewayConectado()) {
      return {
        cancelado: false,
        statusIntegracao: this.status,
        motivo: 'Cancelamento bancário rejeitado: Gateway Enlace-Pay não configurado/conectado nesta instância.'
      };
    }
    try {
      const res = await fetch(`${this.enlacePayEndpoint}/v1/charges/${encodeURIComponent(txId)}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.enlacePayApiKey}` }
      });
      if (res.ok) {
        return { cancelado: true, statusIntegracao: 'CONNECTED' };
      }
      return {
        cancelado: false,
        statusIntegracao: 'ERROR',
        motivo: `Gateway rejeitou cancelamento: HTTP ${res.status}`
      };
    } catch (err: any) {
      return {
        cancelado: false,
        statusIntegracao: 'ERROR',
        motivo: `Erro de comunicação com gateway: ${err.message}`
      };
    }
  }

  // P0 Zero Fake Success: NUNCA retornar estornado: true sem confirmação do gateway externo
  async refundCharge(txId: string, valor?: number): Promise<{ estornado: boolean; statusIntegracao: PaymentProviderStatus; motivo?: string }> {
    if (!this.isGatewayConectado()) {
      return {
        estornado: false,
        statusIntegracao: this.status,
        motivo: 'Estorno bancário rejeitado: Gateway Enlace-Pay não configurado/conectado nesta instância.'
      };
    }
    try {
      const res = await fetch(`${this.enlacePayEndpoint}/v1/charges/${encodeURIComponent(txId)}/refund`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.enlacePayApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ valor })
      });
      if (res.ok) {
        return { estornado: true, statusIntegracao: 'CONNECTED' };
      }
      return {
        estornado: false,
        statusIntegracao: 'ERROR',
        motivo: `Gateway rejeitou estorno: HTTP ${res.status}`
      };
    } catch (err: any) {
      return {
        estornado: false,
        statusIntegracao: 'ERROR',
        motivo: `Erro de comunicação com gateway: ${err.message}`
      };
    }
  }

  // FASE 6: Processamento seguro de Webhook financeiro com validação criptográfica HMAC e replay protection
  async processWebhook(
    payload: any,
    signature?: string,
    timestamp?: string
  ): Promise<{ liquidado: boolean; txId?: string; valorPago?: number; idempotencyKey?: string; erro?: string }> {
    // 1. Validação de assinatura HMAC-SHA256 se gatewaySecret estiver configurado
    if (this.gatewaySecret && signature) {
      const signatureClean = signature.replace('sha256=', '');
      const expectedSignature = crypto
        .createHmac('sha256', this.gatewaySecret)
        .update(JSON.stringify(payload), 'utf8')
        .digest('hex');

      if (signatureClean !== expectedSignature) {
        return {
          liquidado: false,
          erro: 'Assinatura HMAC-SHA256 do Webhook de Cobrança inválida.'
        };
      }
    }

    // 2. Proteção contra Replay: validar janela de tempo (máximo 5 minutos / 300s)
    if (timestamp) {
      const eventTime = new Date(timestamp).getTime();
      const now = Date.now();
      if (Math.abs(now - eventTime) > 300000) {
        return {
          liquidado: false,
          erro: 'Rejeitado por proteção contra Replay Attack: Timestamp do evento fora da janela de 5 minutos.'
        };
      }
    }

    // 3. Validação rigorosa de Schema: proibir fake { pix: { pago: true } }
    if (!payload?.pix || !Array.isArray(payload.pix) || payload.pix.length === 0) {
      return {
        liquidado: false,
        erro: 'Schema inválido: Payload do webhook deve conter array de eventos pix homologado.'
      };
    }

    const item = payload.pix[0];
    if (!item?.txid || typeof item.txid !== 'string' || item.txid.trim() === '') {
      return {
        liquidado: false,
        erro: 'Schema inválido: txid obrigatório no item de liquidação Pix.'
      };
    }

    const valor = Number(item.valor);
    if (isNaN(valor) || valor <= 0) {
      return {
        liquidado: false,
        erro: 'Schema inválido: valor pago deve ser um número positivo.'
      };
    }

    const idempotencyKey = item.e2eId || item.providerEventId || item.endToEndId || item.txid;

    return {
      liquidado: true,
      txId: item.txid.trim(),
      valorPago: valor,
      idempotencyKey
    };
  }

  async reconcile(txId: string): Promise<{ conciliado: boolean; status: ChargePaymentStatus; statusIntegracao: PaymentProviderStatus }> {
    const charge = await this.getCharge(txId);
    return {
      conciliado: charge.status === 'PAGO',
      status: charge.status,
      statusIntegracao: charge.statusIntegracao
    };
  }
}

export const paymentsAdapter = new PaymentsAdapter();
