import { IWhatsAppAdapter, SendMessagePayload } from './whatsapp.interface.ts';

export class WhatsAppAdapter implements IWhatsAppAdapter {
  private apiToken = process.env.WHATSAPP_API_TOKEN;
  private phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  isConfigurado(): boolean {
    return !!(this.apiToken && this.phoneNumberId && !this.apiToken.includes('CHANGE_ME'));
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
}

export const whatsappAdapter = new WhatsAppAdapter();
