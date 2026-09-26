import { aiRouter } from '../router/aiRouter.ts';
import { ILlmProvider, LlmGenerationResult } from '../router/llm.interface.ts';
import { GeminiLlmAdapter } from '../router/gemini.adapter.ts';

let customProvider: ILlmProvider | null = null;

export function getLlmProvider(): { name: string; generateText(prompt: string, systemContext?: string): Promise<string | null> } {
  if (customProvider) {
    return {
      name: customProvider.name,
      generateText: async (p, s) => {
        const res = await customProvider!.generateText(p, { systemInstruction: s });
        return res.text;
      }
    };
  }

  return {
    name: 'AI Router Multi-LLM',
    generateText: async (p, s) => {
      const res = await aiRouter.generateText(p, { systemInstruction: s });
      return res.text;
    }
  };
}

export function setLlmProvider(provider: ILlmProvider): void {
  customProvider = provider;
  aiRouter.registerProvider(provider);
}

export * from '../router/index.ts';
