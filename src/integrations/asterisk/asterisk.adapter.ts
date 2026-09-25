import { IAsteriskAdapter, AsteriskAdapterStatus, WebRtcConfig } from './asterisk.interface.ts';

// -------------------------------------------------------------
// ADAPTER MOCK (Simulação explícita para desenvolvimento local)
// -------------------------------------------------------------
export class AsteriskMockAdapter implements IAsteriskAdapter {
  readonly status: AsteriskAdapterStatus = 'MOCK';

  isConfigurado(): boolean {
    return false;
  }

  obterConfigWebRtc(ramal: string): WebRtcConfig {
    return {
      wssUrl: 'wss://demo-pbx.internal:8089/ws',
      ramal,
      stunServer: 'stun:stun.l.google.com:19302'
    };
  }

  async iniciarChamada(origemRamal: string, destinoNumero: string) {
    return {
      chamadaIniciada: true,
      callId: `mock_call_${Date.now()}`
    };
  }
}

// -------------------------------------------------------------
// ADAPTER REAL (Conexão via WebRTC SIP WSS e Asterisk PBX)
// -------------------------------------------------------------
export class AsteriskRealAdapter implements IAsteriskAdapter {
  readonly status: AsteriskAdapterStatus = 'ADAPTER_PARTIAL';
  private wssUrl = process.env.ASTERISK_WEBRTC_WSS || '';
  private stunServer = process.env.STUN_SERVER || 'stun:stun.l.google.com:19302';

  isConfigurado(): boolean {
    return !!(this.wssUrl && !this.wssUrl.includes('CHANGE_ME'));
  }

  obterConfigWebRtc(ramal: string): WebRtcConfig {
    if (!this.isConfigurado()) {
      throw new Error('Asterisk WebRTC WSS não configurado nesta instância.');
    }
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

export function getAsteriskAdapter(): IAsteriskAdapter {
  if (process.env.ASTERISK_WEBRTC_WSS && !process.env.ASTERISK_WEBRTC_WSS.includes('CHANGE_ME')) {
    return new AsteriskRealAdapter();
  }
  return new AsteriskMockAdapter();
}

export const asteriskAdapter = getAsteriskAdapter();
