import crypto from 'crypto';
import {
  IWhatsAppAdapter,
  SendMessagePayload,
  InboundMessageEvent,
  WebhookStatusEvent
} from './whatsapp.interface.ts';

export class WhatsAppAdapter implements IWhatsAppAdapter {
  readonly status = 'ADAPTER_PARCIAL' as const;
  private apiToken = process.env.WHATSAPP_API_TOKEN;
  private phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  private verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  private appSecret = process.env.WHATSAPP_APP_SECRET;

  isConfigurado(): boolean {
    return !!(this.apiToken && this.phoneNumberId && !this.apiToken.includes('CHANGE_ME'));
  }

  verificarWebhookToken(mode: string, token: string, challenge: string): string | null {
    if (process.env.NODE_ENV === 'production' && (!this.verifyToken || this.verifyToken.includes('CHANGE_ME'))) {
      console.error('[WhatsAppAdapter] WHATSAPP_VERIFY_TOKEN não configurado em produção. Verificação rejeitada.');
      return null;
    }
    const expectedToken = this.verifyToken || 'enlace_meta_verify_token';
    if (mode === 'subscribe' && token === expectedToken) {
      return challenge;
    }
    return null;
  }

  async enviarMensagem(payload: SendMessagePayload): Promise<{ enviado: boolean; messageId?: string; erro?: string }> {
    if (!this.isConfigurado()) {
      return {
        enviado: false,
        erro: 'WhatsApp Cloud API não configurada nesta instância (WHATSAPP_API_TOKEN pendente).'
      };
    }

    try {
      const url = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: payload.toPhone.replace(/\D/g, ''),
          type: 'text',
          text: { body: payload.text }
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return { enviado: false, erro: JSON.stringify(errorData) };
      }

      const data = await res.json();
      return { enviado: true, messageId: data.messages?.[0]?.id };
    } catch (err: any) {
      return { enviado: false, erro: err.message };
    }
  }

  async processarWebhook(rawPayload: any, signatureHeader?: string): Promise<{
    processado: boolean;
    mensagens: InboundMessageEvent[];
    statusAtualizacoes: WebhookStatusEvent[];
    erro?: string;
  }> {
    // 1. Validação HMAC-SHA256 se appSecret estiver configurado
    if (this.appSecret && signatureHeader) {
      const signature = signatureHeader.replace('sha256=', '');
      const expectedSignature = crypto
        .createHmac('sha256', this.appSecret)
        .update(JSON.stringify(rawPayload), 'utf8')
        .digest('hex');

      if (signature !== expectedSignature) {
        return {
          processado: false,
          mensagens: [],
          statusAtualizacoes: [],
          erro: 'Assinatura HMAC-SHA256 do Webhook Meta inválida.'
        };
      }
    }

    const mensagens: InboundMessageEvent[] = [];
    const statusAtualizacoes: WebhookStatusEvent[] = [];

    // 2. Extração segura da estrutura de payloads oficiais Meta Cloud API
    const entry = rawPayload?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value?.messages) {
      for (const msg of value.messages) {
        mensagens.push({
          messageId: msg.id,
          fromPhone: msg.from,
          type: msg.type || 'text',
          text: msg.text?.body,
          timestamp: new Date(Number(msg.timestamp) * 1000 || Date.now()),
          rawPayload: msg
        });
      }
    }

    if (value?.statuses) {
      for (const st of value.statuses) {
        statusAtualizacoes.push({
          messageId: st.id,
          recipientPhone: st.recipient_id,
          status: st.status as any,
          timestamp: new Date(Number(st.timestamp) * 1000 || Date.now())
        });
      }
    }

    return {
      processado: true,
      mensagens,
      statusAtualizacoes
    };
  }
}

export const whatsappAdapter = new WhatsAppAdapter();
