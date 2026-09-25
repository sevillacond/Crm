import { GoogleGenAI } from '@google/genai';
import { ILlmProvider } from './llm.interface.ts';

export class GeminiLlmAdapter implements ILlmProvider {
  readonly name = 'Google Gemini 3.8 Flash';

  async generateText(prompt: string, systemContext?: string): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('CHANGE_ME')) {
      return null;
    }

    try {
      const ai = new GoogleGenAI();
      const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
      // P0.13: Separação estrita de SYSTEM (systemInstruction) e USER (contents)
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: systemContext ? { systemInstruction: systemContext } : undefined
      });

      return response.text || null;
    } catch (err: any) {
      console.warn('[GeminiLlmAdapter] Falha na chamada da API Gemini:', err?.message);
      return null;
    }
  }
}
