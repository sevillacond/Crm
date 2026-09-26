export type LlmProviderStatus = 'READY' | 'NOT_CONFIGURED' | 'DEGRADED' | 'ERROR';

export interface LlmGenerationOptions {
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  metadata?: Record<string, any>;
  instanceId?: string;
  actorId?: string;
}

export interface LlmUsageMetrics {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface LlmGenerationResult {
  text: string | null;
  model: string;
  provider: string;
  usage?: LlmUsageMetrics;
  latencyMs: number;
  raw?: any;
  status: 'SUCCESS' | 'MOCK' | 'ERROR' | 'UNAVAILABLE';
}

export interface ILlmProvider {
  readonly name: string;
  readonly providerId: string;
  checkStatus(): Promise<{ status: LlmProviderStatus; details?: string }>;
  generateText(prompt: string, options?: LlmGenerationOptions): Promise<LlmGenerationResult>;
}
