import { ILlmProvider } from './llm.interface.ts';
import { GeminiLlmAdapter } from './gemini.adapter.ts';

let currentLlmProvider: ILlmProvider = new GeminiLlmAdapter();

export function getLlmProvider(): ILlmProvider {
  return currentLlmProvider;
}

export function setLlmProvider(provider: ILlmProvider): void {
  currentLlmProvider = provider;
}

export * from './llm.interface.ts';
export * from './gemini.adapter.ts';
