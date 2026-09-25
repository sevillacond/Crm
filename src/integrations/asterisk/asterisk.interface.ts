// =============================================================================
// ENLACE TELECOM CRM — ASTERISK / ENLACE-PBX INTERFACE (P0.21)
// Classificação: Separação estrita entre MOCK e REAL
// =============================================================================

export type AsteriskAdapterStatus = 'MOCK' | 'ADAPTER_PARTIAL' | 'REAL';

export interface WebRtcConfig {
  wssUrl: string;
  ramal: string;
  stunServer: string;
  turnServer?: string;
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
  iniciarChamada(origemRamal: string, destinoNumero: string): Promise<{ chamadaIniciada: boolean; callId?: string; erro?: string }>;
  encerrarChamada?(callId: string): Promise<{ sucesso: boolean }>;
}
