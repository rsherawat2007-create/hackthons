import type { IAiProvider, AiCompletionOptions } from "../types.js";

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : text.trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("No JSON object found in model completion text");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

export class OpenAiCompatibleProvider implements IAiProvider {
  public readonly name: string = "openai-compatible";

  private getApiKey(): string | undefined {
    return process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
  }

  private getBaseUrl(): string {
    return (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  }

  private getModel(): string {
    return process.env.OPENAI_MODEL || "gpt-4o-mini";
  }

  public isAvailable(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.trim().length > 0);
  }

  public async generateJson<T>(
    options: AiCompletionOptions,
    validator: (raw: unknown) => T
  ): Promise<T> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("AI provider API key is not configured in environment variables");
    }

    const baseUrl = this.getBaseUrl();
    const model = this.getModel();
    const timeoutMs = options.timeoutMs ?? 7000;
    const maxRetries = options.maxRetries ?? 1;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            temperature: options.temperature ?? 0.3,
            messages: [
              { role: "system", content: options.systemPrompt },
              { role: "user", content: options.userPrompt },
            ],
            response_format: { type: "json_object" },
          }),
          signal: controller.signal,
        });

        clearTimeout(timer);

        // Handle Rate Limits (HTTP 429)
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000 * Math.pow(2, attempt);
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, Math.min(waitTime, 2000)));
            continue;
          }
          throw new Error("AI provider rate limit reached (HTTP 429)");
        }

        // Handle other API failures
        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          throw new Error(`AI provider returned HTTP ${response.status}: ${errText.slice(0, 150)}`);
        }

        const json = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };

        const content = json.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("Empty message content returned from AI provider");
        }

        // Parse and validate structured output
        const parsedRaw = extractJson(content);
        return validator(parsedRaw);
      } catch (err: unknown) {
        clearTimeout(timer);
        if (err instanceof Error) {
          if (err.name === "AbortError") {
            lastError = new Error(`AI request timed out after ${timeoutMs}ms`);
          } else {
            lastError = err;
          }
        } else {
          lastError = new Error("Unknown error during AI completion");
        }

        // If this was a timeout or non-retryable error, do not spin
        if (attempt >= maxRetries) break;
      }
    }

    throw lastError || new Error("Failed to generate AI completion");
  }
}
