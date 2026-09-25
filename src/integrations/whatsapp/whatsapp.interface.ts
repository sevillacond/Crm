// =============================================================================
// ENLACE TELECOM CRM — META CLOUD API WHATSAPP INTERFACE (P0.20)
// Classificação: ADAPTER_PARCIAL (Outbound implementado, Webhook/Inbound estruturado)
// =============================================================================

export type WhatsAppMessageType = 'text' | 'image' | 'audio' | 'document' | 'location' | 'template';
export type WhatsAppMessageDirection = 'INBOUND' | 'OUTBOUND';
export type WhatsAppDeliveryStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface SendMessagePayload {
  toPhone: string;
  text: string;
  templateName?: string;
  idempotencyKey?: string;
}

export interface InboundMessageEvent {
  messageId: string;
  fromPhone: string;
  type: WhatsAppMessageType;
  text?: string;
  mediaUrl?: string;
  timestamp: Date;
  rawPayload: any;
}

export interface WebhookStatusEvent {
  messageId: string;
  recipientPhone: string;
  status: WhatsAppDeliveryStatus;
  timestamp: Date;
}

export interface IWhatsAppAdapter {
  readonly status: 'ADAPTER_PARCIAL';
  isConfigurado(): boolean;
  enviarMensagem(payload: SendMessagePayload): Promise<{ enviado: boolean; messageId?: string; erro?: string }>;
  processarWebhook(rawPayload: any, signatureHeader?: string): Promise<{ processado: boolean; mensagens: InboundMessageEvent[]; statusAtualizacoes: WebhookStatusEvent[]; erro?: string }>;
  verificarWebhookToken(mode: string, token: string, challenge: string): string | null;
}
