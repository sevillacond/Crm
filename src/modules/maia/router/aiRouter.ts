import { ILlmProvider, LlmGenerationOptions, LlmGenerationResult, LlmProviderStatus } from './llm.interface.ts';
import { GeminiLlmAdapter } from './gemini.adapter.ts';
import { NineRouterAdapter } from './ninerouter.adapter.ts';
import { OpenAiCompatibleAdapter } from './openai.adapter.ts';

export interface AiRouterStatus {
  activeProvider: string;
  providers: Array<{
    id: string;
    name: string;
    status: LlmProviderStatus;
    details?: string;
  }>;
  totalRequests: number;
  totalErrors: number;
  averageLatencyMs: number;
}

export class AiRouter {
  private providers = new Map<string, ILlmProvider>();
  private priorityList: string[] = ['9router', 'gemini', 'openai'];
  private totalRequests = 0;
  private totalErrors = 0;
  private totalLatencyMs = 0;

  constructor() {
    this.registerProvider(new NineRouterAdapter());
    this.registerProvider(new GeminiLlmAdapter());
    this.registerProvider(new OpenAiCompatibleAdapter());

    // Allow overriding priority list via env (e.g., AI_ROUTER_PREFERENCE="gemini,9router,openai")
    const envPref = process.env.AI_ROUTER_PREFERENCE;
    if (envPref) {
      this.priorityList = envPref.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    }
  }

  registerProvider(provider: ILlmProvider): void {
    this.providers.set(provider.providerId, provider);
    if (!this.priorityList.includes(provider.providerId)) {
      this.priorityList.push(provider.providerId);
    }
  }

  setPriorityList(order: string[]): void {
    this.priorityList = order;
  }

  getProvider(providerId: string): ILlmProvider | undefined {
    return this.providers.get(providerId);
  }

  async getStatus(): Promise<AiRouterStatus> {
    const list: Array<{ id: string; name: string; status: LlmProviderStatus; details?: string }> = [];
    for (const [id, provider] of this.providers.entries()) {
      try {
        const s = await provider.checkStatus();
        list.push({ id, name: provider.name, status: s.status, details: s.details });
      } catch (err: any) {
        list.push({ id, name: provider.name, status: 'ERROR', details: err?.message });
      }
    }

    const avgLatency = this.totalRequests > 0 ? Math.round(this.totalLatencyMs / this.totalRequests) : 0;
    const preferred = this.priorityList.find(id => {
      const p = list.find(item => item.id === id);
      return p && p.status === 'READY';
    }) || this.priorityList[0] || 'none';

    return {
      activeProvider: preferred,
      providers: list,
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      averageLatencyMs: avgLatency
    };
  }

  async generateText(prompt: string, options?: LlmGenerationOptions): Promise<LlmGenerationResult> {
    this.totalRequests++;
    const startTime = Date.now();

    // Iterate through priority list
    for (const providerId of this.priorityList) {
      const provider = this.providers.get(providerId);
      if (!provider) continue;

      try {
        const status = await provider.checkStatus();
        if (status.status === 'NOT_CONFIGURED') {
          continue; // Try next provider silently
        }

        const result = await provider.generateText(prompt, options);
        if (result && result.status === 'SUCCESS' && result.text) {
          const latency = Date.now() - startTime;
          this.totalLatencyMs += latency;
          return {
            ...result,
            latencyMs: latency
          };
        }

        // If returned UNAVAILABLE or ERROR, continue to fallback
        console.warn(`[AiRouter] Provider ${providerId} não retornou sucesso. Tentando fallback...`);
      } catch (providerError: any) {
        console.warn(`[AiRouter] Erro no provider ${providerId}:`, providerError?.message);
      }
    }

    // All configured providers failed or none configured
    this.totalErrors++;
    const totalLatency = Date.now() - startTime;
    this.totalLatencyMs += totalLatency;

    return {
      text: null,
      model: 'none',
      provider: 'none',
      latencyMs: totalLatency,
      status: 'UNAVAILABLE'
    };
  }
}

export const aiRouter = new AiRouter();
