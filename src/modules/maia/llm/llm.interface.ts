export interface ILlmProvider {
  readonly name: string;
  generateText(prompt: string, systemInstruction?: string): Promise<string | null>;
}
