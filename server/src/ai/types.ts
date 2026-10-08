import { z } from "zod";

export interface AiCompletionOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface AiResult<T> {
  data: T;
  source: "model" | "fallback";
  providerName: string;
  error?: string;
}

/**
 * Replaceable AI Provider interface.
 * Any LLM vendor (OpenAI, Anthropic Claude, Google Gemini, local Ollama, etc.)
 * can implement this interface.
 */
export interface IAiProvider {
  readonly name: string;
  isAvailable(): boolean;
  generateJson<T>(
    options: AiCompletionOptions,
    validator: (raw: unknown) => T
  ): Promise<T>;
}
