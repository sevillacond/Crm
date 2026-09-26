import { ILlmProvider, LlmGenerationOptions, LlmGenerationResult, LlmProviderStatus } from './llm.interface.ts';

export class NineRouterAdapter implements ILlmProvider {
  readonly name = '9router (Enlace AI Gateway)';
  readonly providerId = '9router';

  private getEndpoint(): string | null {
    return process.env.NINEROUTER_ENDPOINT || process.env.AI_ROUTER_ENDPOINT || null;
  }

  private getApiKey(): string | null {
    const key = process.env.NINEROUTER_API_KEY || process.env.AI_ROUTER_API_KEY;
    if (!key || key.includes('CHANGE_ME') || key.trim() === '') {
      return null;
    }
    return key.trim();
  }

  async checkStatus(): Promise<{ status: LlmProviderStatus; details?: string }> {
    const endpoint = this.getEndpoint();
    const apiKey = this.getApiKey();

    if (!endpoint || !apiKey) {
      return {
        status: 'NOT_CONFIGURED',
        details: '9router endpoint ou API key não configurados.'
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${endpoint.replace(/\/+$/, '')}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-Enlace-App': 'enlace-crm'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return { status: 'READY', details: '9router gateway operacional e autenticado' };
      }
      return { status: 'DEGRADED', details: `9router respondeu com status HTTP ${res.status}` };
    } catch (err: any) {
      return { status: 'ERROR', details: `Falha ao conectar no 9router: ${err?.message}` };
    }
  }

  async generateText(prompt: string, options?: LlmGenerationOptions): Promise<LlmGenerationResult> {
    const endpoint = this.getEndpoint();
    const apiKey = this.getApiKey();
    const model = process.env.NINEROUTER_MODEL || '9router-auto';

    if (!endpoint || !apiKey) {
      return {
        text: null,
        model,
        provider: this.providerId,
        latencyMs: 0,
        status: 'UNAVAILABLE'
      };
    }

    const startTime = Date.now();
    try {
      const messages: Array<{ role: string; content: string }> = [];
      if (options?.systemInstruction) {
        messages.push({ role: 'system', content: options.systemInstruction });
      }
      messages.push({ role: 'user', content: prompt });

      const controller = new AbortController();
      const timeoutMs = options?.timeoutMs || 15000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const url = `${endpoint.replace(/\/+$/, '')}/chat/completions`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-Enlace-Instance': options?.instanceId || 'unknown',
          'X-Enlace-Actor': options?.actorId || 'unknown',
          'X-Enlace-App': 'enlace-crm'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 1024
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;
      if (!response.ok) {
        throw new Error(`9router HTTP ${response.status}: ${await response.text().catch(() => '')}`);
      }

      const json = await response.json();
      const text = json?.choices?.[0]?.message?.content || null;

      return {
        text,
        model: json?.model || model,
        provider: this.providerId,
        usage: {
          promptTokens: json?.usage?.prompt_tokens,
          completionTokens: json?.usage?.completion_tokens,
          totalTokens: json?.usage?.total_tokens
        },
        latencyMs,
        status: text ? 'SUCCESS' : 'UNAVAILABLE',
        raw: json
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      console.warn('[NineRouterAdapter] Falha na chamada ao 9router:', err?.message);
      return {
        text: null,
        model,
        provider: this.providerId,
        latencyMs,
        status: 'ERROR',
        raw: { error: err?.message }
      };
    }
  }
}
