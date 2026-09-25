// =============================================================================
// ENLACE TELECOM CRM — ASTERISK / ENLACE-PBX INTERFACE (P0/P1)
// Classificação estrita: Zero Fake Success em Telefonia IP
// =============================================================================

export type AsteriskAdapterStatus =
  | 'NOT_CONFIGURED'
  | 'MOCK'
  | 'STUB'
  | 'ADAPTER_PARTIAL'
  | 'CONNECTED'
  | 'PRODUCTION'
  | 'ERROR';

export interface WebRtcConfig {
  wssUrl: string;
  ramal: string;
  stunServer: string;
  turnServer?: string;
  statusIntegracao: AsteriskAdapterStatus;
}

export interface CallRecord {
  callId: string;
  origem: string;
  destino: string;
  status: 'DISCANDO' | 'CONECTADA' | 'FINALIZADA' | 'FALHOU';
  timestampInicio: Date;
  timestampFim?: Date;
  duracaoSegundos?: number;
}

export interface IAsteriskAdapter {
  readonly status: AsteriskAdapterStatus;
  isConfigurado(): boolean;
  obterConfigWebRtc(ramal: string): WebRtcConfig;
  iniciarChamada(origemRamal: string, destinoNumero: string): Promise<{
    chamadaIniciada: boolean;
    callId?: string;
    statusIntegracao: AsteriskAdapterStatus;
    erro?: string;
    aviso?: string;
  }>;
  encerrarChamada?(callId: string): Promise<{ sucesso: boolean; statusIntegracao: AsteriskAdapterStatus }>;
}
