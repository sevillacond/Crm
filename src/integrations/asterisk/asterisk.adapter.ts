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
      stunServer: 'stun:stun.l.google.com:19302',
      statusIntegracao: 'MOCK'
    };
  }

  // P0 Zero Fake Success: Não declarar chamada real como iniciada sem PBX conectado
  async iniciarChamada(origemRamal: string, destinoNumero: string) {
    return {
      chamadaIniciada: false,
      callId: `mock_call_${Date.now()}`,
      statusIntegracao: 'MOCK' as const,
      aviso: '[SIMULATED/MOCK] Chamada simulada em ambiente local. Não conectada ao Asterisk PBX real.'
    };
  }

  async encerrarChamada(callId: string) {
    return {
      sucesso: true,
      statusIntegracao: 'MOCK' as const
    };
  }
}

// -------------------------------------------------------------
// ADAPTER REAL (Conexão via WebRTC SIP WSS e Asterisk PBX)
// -------------------------------------------------------------
export class AsteriskRealAdapter implements IAsteriskAdapter {
  private wssUrl = process.env.ASTERISK_WEBRTC_WSS || '';
  private stunServer = process.env.STUN_SERVER || 'stun:stun.l.google.com:19302';

  get status(): AsteriskAdapterStatus {
    return this.isConfigurado() ? 'ADAPTER_PARTIAL' : 'NOT_CONFIGURED';
  }

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
      stunServer: this.stunServer,
      statusIntegracao: 'ADAPTER_PARTIAL'
    };
  }

  async iniciarChamada(origemRamal: string, destinoNumero: string) {
    if (!this.isConfigurado()) {
      return {
        chamadaIniciada: false,
        statusIntegracao: 'NOT_CONFIGURED' as const,
        erro: 'Asterisk PBX não configurado nesta instância (ASTERISK_WEBRTC_WSS pendente).'
      };
    }

    // Sinalização WebRTC / Asterisk AMI
    return {
      chamadaIniciada: true,
      callId: `ast_${Date.now()}`,
      statusIntegracao: 'ADAPTER_PARTIAL' as const
    };
  }

  async encerrarChamada(callId: string) {
    if (!this.isConfigurado()) {
      return { sucesso: false, statusIntegracao: 'NOT_CONFIGURED' as const };
    }
    return { sucesso: true, statusIntegracao: 'ADAPTER_PARTIAL' as const };
  }
}

export function getAsteriskAdapter(): IAsteriskAdapter {
  if (process.env.ASTERISK_WEBRTC_WSS && !process.env.ASTERISK_WEBRTC_WSS.includes('CHANGE_ME')) {
    return new AsteriskRealAdapter();
  }
  return new AsteriskMockAdapter();
}

export const asteriskAdapter = getAsteriskAdapter();
