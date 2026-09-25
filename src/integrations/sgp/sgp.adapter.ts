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

  async healthCheck(): Promise<{ ok: boolean; latencyMs?: number; message?: string; statusIntegracao: string }> {
    if (!this.isConfigurado()) {
      return { ok: false, statusIntegracao: 'NOT_CONFIGURED', message: 'IXC Soft não configurado nesta instância.' };
    }
    const start = Date.now();
    try {
      const res = await fetch(`${this.endpoint}/radusuarios`, {
        method: 'GET',
        headers: { Authorization: `Basic ${Buffer.from(this.token || '').toString('base64')}` }
      });
      return { ok: res.ok, statusIntegracao: res.ok ? 'CONNECTED' : 'ERROR', latencyMs: Date.now() - start };
    } catch (err: any) {
      return { ok: false, statusIntegracao: 'ERROR', message: err.message, latencyMs: Date.now() - start };
    }
  }

  async consultarCliente(cpfCnpj: string): Promise<SgpClienteSync> {
    if (!this.isConfigurado()) {
      return {
        cpfCnpj,
        nome: 'Cliente Não Integrado',
        statusConexao: 'NOT_CONFIGURED'
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

      if (res.status === 401 || res.status === 403) {
        return { cpfCnpj, nome: 'Autenticação IXC Inválida', statusConexao: 'UNAUTHORIZED' };
      }
      if (res.status === 404) {
        return { cpfCnpj, nome: 'Não Encontrado', statusConexao: 'NAO_ENCONTRADO' };
      }
      if (!res.ok) {
        return { cpfCnpj, nome: `Erro IXC (${res.status})`, statusConexao: 'NETWORK_ERROR' };
      }

      return (await res.json()) as SgpClienteSync;
    } catch (err: any) {
      const isTimeout = err.name === 'AbortError';
      console.warn(`[IxcAdapter] Falha na consulta IXC:`, err.message);
      return {
        cpfCnpj,
        nome: isTimeout ? 'Timeout na consulta IXC' : 'Erro de Conexão IXC',
        statusConexao: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR'
      };
    }
  }

  async desbloquearConfianca(loginPppoe: string): Promise<{ sucesso: boolean; mensagem: string; statusIntegracao: string }> {
    if (!this.isConfigurado()) {
      return { sucesso: false, statusIntegracao: 'NOT_CONFIGURED', mensagem: 'Integração com IXC Soft pendente de configuração.' };
    }
    try {
      const res = await fetch(`${this.endpoint}/radusuarios_desbloqueio`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(this.token || '').toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ login: loginPppoe })
      });
      if (res.ok) {
        return { sucesso: true, statusIntegracao: 'CONNECTED', mensagem: `Desbloqueio de 48h efetuado no IXC para login ${loginPppoe}.` };
      }
      return { sucesso: false, statusIntegracao: 'ERROR', mensagem: `IXC rejeitou desbloqueio: HTTP ${res.status}` };
    } catch (err: any) {
      return { sucesso: false, statusIntegracao: 'ERROR', mensagem: `Falha de rede ao contatar IXC: ${err.message}` };
    }
  }
}

// -------------------------------------------------------------
// ADAPTER HUBSOFT (API REST v1 - Classificação Estrita: STUB)
// Zero Fake Success: Elimina qualquer retorno fake de "ok: true" ou "latencyMs: 15"
// -------------------------------------------------------------
export class HubSoftAdapter implements ISgpAdapter {
  readonly nome = 'HubSoft ERP';
  readonly status = 'STUB' as const;
  private endpoint = process.env.HUBSOFT_API_ENDPOINT || process.env.SGP_API_ENDPOINT;
  private token = process.env.HUBSOFT_API_TOKEN || process.env.SGP_API_TOKEN;

  isConfigurado(): boolean {
    return !!(this.endpoint && this.token && !this.token.includes('CHANGE_ME'));
  }

  // P0 Zero Fake Success: Nunca retornar fake ok: true ou latência forjada
  async healthCheck(): Promise<{ ok: boolean; latencyMs?: number; message?: string; statusIntegracao: string }> {
    if (!this.isConfigurado()) {
      return { ok: false, statusIntegracao: 'NOT_CONFIGURED', message: 'HubSoft não configurado nesta instância.' };
    }
    return {
      ok: false,
      statusIntegracao: 'STUB',
      message: 'HubSoft ERP: Adaptador em estágio STUB (homologação de endpoints reais pendente). Não conectado.'
    };
  }

  async consultarCliente(cpfCnpj: string): Promise<SgpClienteSync> {
    if (!this.isConfigurado()) {
      return {
        cpfCnpj,
        nome: 'Cliente Não Integrado',
        statusConexao: 'NOT_CONFIGURED'
      };
    }
    return {
      cpfCnpj,
      nome: 'HubSoft (Adaptador STUB não homologado)',
      statusConexao: 'NOT_CONFIGURED'
    };
  }

  async desbloquearConfianca(loginPppoe: string): Promise<{ sucesso: boolean; mensagem: string; statusIntegracao: string }> {
    return {
      sucesso: false,
      statusIntegracao: 'STUB',
      mensagem: 'Desbloqueio em confiança indisponível: Adaptador HubSoft pendente de homologação com API real.'
    };
  }
}

// -------------------------------------------------------------
// FACTORY & ADAPTER PADRÃO
// -------------------------------------------------------------
export class SgpAdapter implements ISgpAdapter {
  readonly nome = 'SGP / ERP de Provedor';
  private activeAdapter: ISgpAdapter;

  constructor() {
    const integracao = process.env.SGP_INTEGRACAO || 'IXC_SOFT';
    if (integracao === 'HUBSOFT') {
      this.activeAdapter = new HubSoftAdapter();
    } else {
      this.activeAdapter = new IxcAdapter();
    }
  }

  get status(): 'MOCK' | 'STUB' | 'ADAPTER_PARTIAL' | 'CONNECTED' | 'REAL' | 'NOT_CONFIGURED' {
    return this.activeAdapter.status as any;
  }

  isConfigurado(): boolean {
    return this.activeAdapter.isConfigurado();
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs?: number; message?: string; statusIntegracao?: string }> {
    return this.activeAdapter.healthCheck();
  }

  async consultarCliente(cpfCnpj: string): Promise<SgpClienteSync> {
    return this.activeAdapter.consultarCliente(cpfCnpj);
  }

  async desbloquearConfianca(loginPppoe: string): Promise<{ sucesso: boolean; mensagem: string; statusIntegracao?: string }> {
    return this.activeAdapter.desbloquearConfianca(loginPppoe);
  }
}

export const sgpAdapter = new SgpAdapter();
