export interface IAsteriskAdapter {
  isConfigurado(): boolean;
  obterConfigWebRtc(ramal: string): { wssUrl: string; ramal: string; stunServer: string };
  iniciarChamada(origemRamal: string, destinoNumero: string): Promise<{ chamadaIniciada: boolean; callId?: string; erro?: string }>;
}
