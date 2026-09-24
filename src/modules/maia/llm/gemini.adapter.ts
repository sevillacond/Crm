import { GoogleGenAI } from '@google/genai';
import { ILlmProvider } from './llm.interface.ts';

export class GeminiLlmAdapter implements ILlmProvider {
  readonly name = 'Gemini 2.5 Flash';

  async generateText(prompt: string, systemContext?: string): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('CHANGE_ME')) {
      return null;
    }

    try {
      const ai = new GoogleGenAI();
      const content = systemContext
        ? `${systemContext}\n\nSolicitação do Operador: ${prompt}`
        : prompt;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: content }] }]
      });

      return response.text || null;
    } catch (err: any) {
      console.warn('[GeminiLlmAdapter] Falha na chamada da API Gemini:', err?.message);
      return null;
    }
  }
}
