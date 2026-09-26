import { GoogleGenAI } from '@google/genai';
import { ILlmProvider, LlmGenerationOptions, LlmGenerationResult, LlmProviderStatus } from './llm.interface.ts';

export class GeminiLlmAdapter implements ILlmProvider {
  readonly name = 'Google Gemini';
  readonly providerId = 'gemini';

  private getApiKey(): string | null {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.includes('CHANGE_ME') || key.trim() === '') {
      return null;
    }
    return key.trim();
  }

  async checkStatus(): Promise<{ status: LlmProviderStatus; details?: string }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { status: 'NOT_CONFIGURED', details: 'GEMINI_API_KEY não configurada' };
    }
    return { status: 'READY', details: 'Google Gemini adapter configurado' };
  }

  async generateText(prompt: string, options?: LlmGenerationOptions): Promise<LlmGenerationResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        text: null,
        model: 'gemini-3.8-flash',
        provider: this.providerId,
        latencyMs: 0,
        status: 'UNAVAILABLE'
      };
    }

    const startTime = Date.now();
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: options?.systemInstruction,
          temperature: options?.temperature ?? 0.7,
          topP: 0.95
        }
      });

      const latencyMs = Date.now() - startTime;
      const text = response.text || null;

      return {
        text,
        model: modelName,
        provider: this.providerId,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount,
          completionTokens: response.usageMetadata?.candidatesTokenCount,
          totalTokens: response.usageMetadata?.totalTokenCount
        },
        latencyMs,
        status: text ? 'SUCCESS' : 'UNAVAILABLE'
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      console.warn('[GeminiLlmAdapter] Falha na inferência Gemini:', err?.message);
      return {
        text: null,
        model: modelName,
        provider: this.providerId,
        latencyMs,
        status: 'ERROR',
        raw: { error: err?.message }
      };
    }
  }
}
