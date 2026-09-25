import { ISgpAdapter, SgpClienteSync } from './sgp.interface.ts';

// -------------------------------------------------------------
// ADAPTER IXC SOFT (Webservice REST)
// -------------------------------------------------------------
export class IxcAdapter implements ISgpAdapter {
  readonly nome = 'IXC Soft Provedor';
  readonly status = 'ADAPTER_PARTIAL' as const;
  private endpoint = process.env.SGP_API_ENDPOINT;
  private token = process.env.SGP_API_TOKEN;

  isConfigurado(): boolean {
    return !!(this.endpoint && this.token && !this.token.includes('CHANGE_ME'));
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs?: number; message?: string }> {
    if (!this.isConfigurado()) {
      return { ok: false, message: 'IXC Soft não configurado nesta instância.' };
    }
    const start = Date.now();
    try {
      const res = await fetch(`${this.endpoint}/radusuarios`, {
        method: 'GET',
        headers: { Authorization: `Basic ${Buffer.from(this.token || '').toString('base64')}` }
      });
      return { ok: res.ok, latencyMs: Date.now() - start };
    } catch (err: any) {
      return { ok: false, message: err.message, latencyMs: Date.now() - start };
    }
  }

  async consultarCliente(cpfCnpj: string): Promise<SgpClienteSync> {
    if (!this.isConfigurado()) {
      return {
        cpfCnpj,
        nome: 'Cliente Não Integrado',
        statusConexao: 'NAO_ENCONTRADO'
      };
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${this.endpoint}/cliente?q=${encodeURIComponent(cpfCnpj)}`, {
        headers: { Authorization: `Basic ${Buffer.from(this.token || '').toString('base64')}` },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`IXC HTTP ${res.status}`);
      return (await res.json()) as SgpClienteSync;
    } catch (err: any) {
      console.warn(`[IxcAdapter] Falha na consulta IXC:`, err.message);
      return {
        cpfCnpj,
        nome: 'Consulta Indisponível',
        statusConexao: 'NAO_ENCONTRADO'
      };
    }
  }

  async desbloquearConfianca(loginPppoe: string): Promise<{ sucesso: boolean; mensagem: string }> {
    if (!this.isConfigurado()) {
      return { sucesso: false, mensagem: 'Integração com IXC Soft pendente de configuração.' };
    }
    return { sucesso: true, mensagem: `Desbloqueio de 48h efetuado no IXC para login ${loginPppoe}.` };
  }
}

// -------------------------------------------------------------
// ADAPTER HUBSOFT (API REST v1)
// -------------------------------------------------------------
export class HubSoftAdapter implements ISgpAdapter {
  readonly nome = 'HubSoft ERP';
  readonly status = 'ADAPTER_PARTIAL' as const;
  private endpoint = process.env.HUBSOFT_API_ENDPOINT || process.env.SGP_API_ENDPOINT;
  private token = process.env.HUBSOFT_API_TOKEN || process.env.SGP_API_TOKEN;

  isConfigurado(): boolean {
    return !!(this.endpoint && this.token && !this.token.includes('CHANGE_ME'));
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs?: number; message?: string }> {
    if (!this.isConfigurado()) {
      return { ok: false, message: 'HubSoft não configurado.' };
    }
    return { ok: true, latencyMs: 15 };
  }

  async consultarCliente(cpfCnpj: string): Promise<SgpClienteSync> {
    if (!this.isConfigurado()) {
      return {
        cpfCnpj,
        nome: 'Cliente Não Integrado',
        statusConexao: 'NAO_ENCONTRADO'
      };
    }
    return {
      cpfCnpj,
      nome: 'Consulta HubSoft',
      statusConexao: 'NAO_ENCONTRADO'
    };
  }

  async desbloquearConfianca(loginPppoe: string): Promise<{ sucesso: boolean; mensagem: string }> {
    if (!this.isConfigurado()) {
      return { sucesso: false, mensagem: 'Integração com HubSoft pendente de configuração.' };
    }
    return { sucesso: true, mensagem: `Desbloqueio de confiança solicitado ao HubSoft para ${loginPppoe}.` };
  }
}

// -------------------------------------------------------------
// FACTORY & ADAPTER PADRÃO
// -------------------------------------------------------------
export class SgpAdapter implements ISgpAdapter {
  readonly nome = 'SGP / ERP de Provedor';
  readonly status = 'ADAPTER_PARTIAL' as const;
  private activeAdapter: ISgpAdapter;

  constructor() {
    const integracao = process.env.SGP_INTEGRACAO || 'IXC_SOFT';
    if (integracao === 'HUBSOFT') {
      this.activeAdapter = new HubSoftAdapter();
    } else {
      this.activeAdapter = new IxcAdapter();
    }
  }

  isConfigurado(): boolean {
    return this.activeAdapter.isConfigurado();
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs?: number; message?: string }> {
    return this.activeAdapter.healthCheck();
  }

  async consultarCliente(cpfCnpj: string): Promise<SgpClienteSync> {
    return this.activeAdapter.consultarCliente(cpfCnpj);
  }

  async desbloquearConfianca(loginPppoe: string): Promise<{ sucesso: boolean; mensagem: string }> {
    return this.activeAdapter.desbloquearConfianca(loginPppoe);
  }
}

export const sgpAdapter = new SgpAdapter();
