export interface SendMessagePayload {
  toPhone: string;
  text: string;
  templateName?: string;
}

export interface IWhatsAppAdapter {
  isConfigurado(): boolean;
  enviarMensagem(payload: SendMessagePayload): Promise<{ enviado: boolean; messageId?: string; erro?: string }>;
}
