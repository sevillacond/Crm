import { ILlmProvider, LlmGenerationOptions, LlmGenerationResult, LlmProviderStatus } from './llm.interface.ts';

export class OpenAiCompatibleAdapter implements ILlmProvider {
  readonly name = 'OpenAI Compatible';
  readonly providerId = 'openai';

  private getEndpoint(): string {
    return process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  }

  private getApiKey(): string | null {
    const key = process.env.OPENAI_API_KEY;
    if (!key || key.includes('CHANGE_ME') || key.trim() === '') {
      return null;
    }
    return key.trim();
  }

  async checkStatus(): Promise<{ status: LlmProviderStatus; details?: string }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { status: 'NOT_CONFIGURED', details: 'OPENAI_API_KEY não configurada' };
    }
    return { status: 'READY', details: 'OpenAI provider configurado' };
  }

  async generateText(prompt: string, options?: LlmGenerationOptions): Promise<LlmGenerationResult> {
    const apiKey = this.getApiKey();
    const endpoint = this.getEndpoint();
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    if (!apiKey) {
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

      const res = await fetch(`${endpoint.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature ?? 0.7
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        throw new Error(`OpenAI HTTP ${res.status}: ${await res.text().catch(() => '')}`);
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || null;

      return {
        text,
        model,
        provider: this.providerId,
        usage: {
          promptTokens: data?.usage?.prompt_tokens,
          completionTokens: data?.usage?.completion_tokens,
          totalTokens: data?.usage?.total_tokens
        },
        latencyMs,
        status: text ? 'SUCCESS' : 'UNAVAILABLE'
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
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
