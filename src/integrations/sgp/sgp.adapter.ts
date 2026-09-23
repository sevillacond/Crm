import { ISgpAdapter, SgpClienteSync } from './sgp.interface.ts';

export class SgpAdapter implements ISgpAdapter {
  nome = 'SGP / ERP de Provedor';
  private endpoint = process.env.SGP_API_ENDPOINT;
  private token = process.env.SGP_API_TOKEN;

  isConfigurado(): boolean {
    return !!(this.endpoint && this.token && !this.token.includes('CHANGE_ME'));
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

      const res = await fetch(`${this.endpoint}/clientes/consultar?cpf_cnpj=${encodeURIComponent(cpfCnpj)}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`SGP API HTTP ${res.status}`);
      }

      return (await res.json()) as SgpClienteSync;
    } catch (err: any) {
      console.warn(`[SgpAdapter] Erro na consulta do SGP (${err.message}).`);
      return {
        cpfCnpj,
        nome: 'Consulta Indisponível',
        statusConexao: 'NAO_ENCONTRADO'
      };
    }
  }

  async desbloquearConfianca(loginPppoe: string): Promise<{ sucesso: boolean; mensagem: string }> {
    if (!this.isConfigurado()) {
      return {
        sucesso: false,
        mensagem: 'Integração com SGP não configurada para desbloqueio em confiança.'
      };
    }

    try {
      const res = await fetch(`${this.endpoint}/radius/desbloqueio-confianca`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ loginPppoe })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { sucesso: true, mensagem: 'Desbloqueio temporário concedido por 48 horas.' };
    } catch (err: any) {
      return { sucesso: false, mensagem: `Falha na requisição ao SGP: ${err.message}` };
    }
  }
}

export const sgpAdapter = new SgpAdapter();
