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
  private lastVerificationOk = false;

  // Zero Fake Success: PIX_CHAVE_INSTANCIA isolada NÃO comprova conexão com gateway
  get status(): PaymentProviderStatus {
    const isProd = process.env.NODE_ENV === 'production';
    if (!this.isGatewayConectado()) {
      return isProd ? 'NOT_CONFIGURED' : 'MOCK';
    }
    if (this.lastVerificationOk) {
      return isProd ? 'PRODUCTION' : 'CONNECTED';
    }
    return isProd ? 'CONFIGURED' : 'ADAPTER_PARTIAL';
  }

  get modo(): PaymentExecutionMode {
    return this.isGatewayConectado() ? 'GATEWAY_PRODUCAO' : 'MOCK_SANDBOX';
  }

  isConfigurado(): boolean {
    return !!(this.pixKey && !this.pixKey.includes('CHANGE_ME'));
  }

  isGatewayConectado(): boolean {
    return !!(
      this.enlacePayApiKey &&
      !this.enlacePayApiKey.includes('CHANGE_ME') &&
      this.enlacePayEndpoint &&
      !this.enlacePayEndpoint.includes('CHANGE_ME')
    );
  }

  async checkConnection(): Promise<{ status: PaymentProviderStatus; latencyMs?: number; erro?: string }> {
    if (!this.isGatewayConectado()) {
      return {
        status: process.env.NODE_ENV === 'production' ? 'NOT_CONFIGURED' : 'MOCK',
        erro: 'Credenciais do Enlace-Pay (ENLACE_PAY_API_KEY ou ENLACE_PAY_ENDPOINT) não configuradas.'
      };
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${this.enlacePayEndpoint}/v1/health`, {
        headers: { Authorization: `Bearer ${this.enlacePayApiKey}` },
        signal: controller.signal
      });
      clearTimeout(timeout);

      const latencyMs = Date.now() - start;
      if (res.ok) {
        this.lastVerificationOk = true;
        return {
          status: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'CONNECTED',
          latencyMs
        };
      }

      this.lastVerificationOk = false;
      return {
        status: 'ERROR',
        latencyMs,
        erro: `Enlace-Pay retornou status HTTP ${res.status}.`
      };
    } catch (err: any) {
      this.lastVerificationOk = false;
      return {
        status: 'ERROR',
        latencyMs: Date.now() - start,
        erro: `Falha de rede ao conectar ao Enlace-Pay: ${err.message}`
      };
    }
  }

  async createCharge(payload: PixCobrancaPayload): Promise<PixCobrancaResult> {
    return this.gerarPixCobranca(payload);
  }

  async gerarPixCobranca(payload: PixCobrancaPayload): Promise<PixCobrancaResult> {
    const isProd = process.env.NODE_ENV === 'production';
    const allowMock = process.env.PAYMENTS_ALLOW_MOCK === 'true';

    // FASE 1 & FASE 2: Bloqueio estrito de MOCK em produção
    if (isProd) {
      if (allowMock) {
        throw new Error('[FATAL] PAYMENTS_ALLOW_MOCK é estritamente proibido em ambiente de produção.');
      }
      if (!this.isGatewayConectado()) {
        throw new Error(
          'Gateway de Pagamento Pix / Enlace-Pay não configurado nesta instância em produção (ENLACE_PAY_API_KEY ou ENDPOINT pendente). Emissão de cobrança recusada.'
        );
      }
    }

    // Se houver gateway real Enlace-Pay configurado
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
        this.lastVerificationOk = true;
        return {
          modoExecucao: 'GATEWAY_PRODUCAO',
          statusIntegracao: isProd ? 'PRODUCTION' : 'CONNECTED',
          copiaECola: data.copiaECola,
          txId: data.txId,
          valor: payload.valor,
          expiracaoMinutos: data.expiracaoMinutos || 60,
          chavePix: data.chavePix || this.pixKey || '',
          status: 'PENDENTE'
        };
      } catch (gatewayErr: any) {
        if (isProd) {
          throw new Error(`Falha ao comunicar com Enlace-Pay Gateway em produção: ${gatewayErr.message}`);
        }
        console.warn('[PaymentsAdapter] Gateway Enlace-Pay indisponível, recorrendo a sandbox dev:', gatewayErr.message);
      }
    }

    // Em produção, nunca chega aqui sob nenhuma hipótese
    if (isProd) {
      throw new Error('Operação de pagamento MOCK bloqueada em produção.');
    }

    // Modo MOCK / Sandbox exclusivo para desenvolvimento e teste
    const txId = `pix_mock_${Date.now().toString().slice(-8)}${crypto.randomBytes(4).toString('hex')}`;
    const chave = this.pixKey || 'sandbox@provedor-demo.local';
    const nomeProvedor = (process.env.PROVIDER_NOME_FANTASIA || 'PROVEDOR TELECOM').toUpperCase().slice(0, 25);
    const cidade = (process.env.PROVIDER_CIDADE || 'BRASIL').toUpperCase().slice(0, 15);

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

  // FASE 4: getCharge() nunca converte falha em PENDENTE
  async getCharge(txId: string): Promise<{ txId: string; status: ChargePaymentStatus; valor: number; statusIntegracao: PaymentProviderStatus }> {
    if (!this.isGatewayConectado()) {
      return { txId, status: 'NOT_CONFIGURED', valor: 0, statusIntegracao: this.status };
    }
    try {
      const response = await fetch(`${this.enlacePayEndpoint}/v1/charges/${encodeURIComponent(txId)}`, {
        headers: { Authorization: `Bearer ${this.enlacePayApiKey}` }
      });
      if (response.ok) {
        const data: any = await response.json();
        const validStatuses: ChargePaymentStatus[] = ['PENDENTE', 'PAGO', 'EXPIRADO', 'CANCELADO', 'ESTORNADO'];
        const chargeStatus = validStatuses.includes(data.status) ? data.status : 'UNKNOWN';
        this.lastVerificationOk = true;
        return {
          txId,
          status: chargeStatus,
          valor: data.valor || 0,
          statusIntegracao: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'CONNECTED'
        };
      }
      return { txId, status: 'ERROR', valor: 0, statusIntegracao: 'ERROR' };
    } catch {
      return { txId, status: 'ERROR', valor: 0, statusIntegracao: 'ERROR' };
    }
  }

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

  // FASE 5, FASE 6 & FASE 7: Processamento seguro de Webhook financeiro com HMAC timing-safe e replay protection
  async processWebhook(
    payload: any,
    signature?: string,
    timestamp?: string,
    rawBody?: Buffer | string
  ): Promise<{ liquidado: boolean; txId?: string; valorPago?: number; idempotencyKey?: string; erro?: string }> {
    const isProd = process.env.NODE_ENV === 'production';

    // FASE 5: Em produção, secret e assinatura são OBRIGATÓRIOS
    if (isProd && (!this.gatewaySecret || !signature)) {
      return {
        liquidado: false,
        erro: 'Webhook rejeitado: Em produção, PIX_GATEWAY_SECRET e assinatura HMAC (x-signature) são estritamente obrigatórios.'
      };
    }

    // Se o secret estiver configurado, a assinatura é estritamente obrigatória
    if (this.gatewaySecret && !signature) {
      return {
        liquidado: false,
        erro: 'Webhook rejeitado: PIX_GATEWAY_SECRET configurado mas o cabeçalho de assinatura (x-signature) está ausente.'
      };
    }

    // FASE 6: Validação de assinatura com crypto.timingSafeEqual sobre raw body ou JSON
    if (this.gatewaySecret && signature) {
      const signatureClean = signature.replace(/^sha256=/, '').trim();
      const bodyToVerify = rawBody || JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', this.gatewaySecret)
        .update(bodyToVerify)
        .digest('hex');

      if (
        signatureClean.length !== expectedSignature.length ||
        !crypto.timingSafeEqual(Buffer.from(signatureClean, 'utf8'), Buffer.from(expectedSignature, 'utf8'))
      ) {
        return {
          liquidado: false,
          erro: 'Assinatura HMAC-SHA256 do Webhook de Cobrança inválida (Falha criptográfica timing-safe).'
        };
      }
    }

    // FASE 7: Proteção contra Replay Attack com janela de 300 segundos
    if (isProd && !timestamp) {
      return {
        liquidado: false,
        erro: 'Webhook rejeitado: Em produção, timestamp do evento (x-timestamp) é obrigatório para proteção contra replay.'
      };
    }

    if (timestamp) {
      const eventTime = new Date(timestamp).getTime();
      const now = Date.now();
      if (isNaN(eventTime)) {
        return {
          liquidado: false,
          erro: 'Timestamp do evento inválido ou mal formatado.'
        };
      }
      const windowMs = 300000; // 300s (5 minutos)
      if (now - eventTime > windowMs) {
        return {
          liquidado: false,
          erro: 'Rejeitado por proteção contra Replay Attack: Evento expirado (fora da janela de 300s).'
        };
      }
      if (eventTime - now > 60000) { // Tolerância de 1 min para clock skew
        return {
          liquidado: false,
          erro: 'Rejeitado por proteção contra Replay Attack: Timestamp futuro excessivo detectado.'
        };
      }
    }

    // Validação estrita de Schema
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
