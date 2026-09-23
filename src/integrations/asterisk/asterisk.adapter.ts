import { IAsteriskAdapter } from './asterisk.interface.ts';

export class AsteriskAdapter implements IAsteriskAdapter {
  private wssUrl = process.env.ASTERISK_WEBRTC_WSS || 'wss://pbx.enlace.internal:8089/ws';
  private stunServer = process.env.STUN_SERVER || 'stun:stun.l.google.com:19302';

  isConfigurado(): boolean {
    return !!(process.env.ASTERISK_WEBRTC_WSS && !process.env.ASTERISK_WEBRTC_WSS.includes('CHANGE_ME'));
  }

  obterConfigWebRtc(ramal: string) {
    return {
      wssUrl: this.wssUrl,
      ramal,
      stunServer: this.stunServer
    };
  }

  async iniciarChamada(origemRamal: string, destinoNumero: string) {
    if (!this.isConfigurado()) {
      return {
        chamadaIniciada: false,
        erro: 'Asterisk PBX não configurado nesta instância (ASTERISK_WEBRTC_WSS pendente).'
      };
    }
    return {
      chamadaIniciada: true,
      callId: `ast_${Date.now()}`
    };
  }
}

export const asteriskAdapter = new AsteriskAdapter();
