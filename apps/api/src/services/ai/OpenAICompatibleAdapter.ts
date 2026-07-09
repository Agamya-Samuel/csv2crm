import OpenAI from "openai";
import { config } from "../../config";
import { AIServiceError } from "../../utils/errors";
import { extractedBatchSchema } from "../../utils/validation";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import type { AIExtractor, ExtractionResult } from "./AIExtractor";
import type { RawRow, ExtractedRecord } from "../../types";

export class OpenAICompatibleAdapter implements AIExtractor {
  private client: OpenAI;
  private model: string;

  constructor(baseURL?: string, apiKey?: string, model?: string) {
    this.client = new OpenAI({
      baseURL: baseURL || "https://openrouter.ai/api/v1",
      apiKey: apiKey || config.OPENROUTER_API_KEY || config.OPENAI_API_KEY || "",
    });
    this.model = model || config.AI_MODEL || "openai/gpt-4o-mini";
  }

  async extractBatch(rows: RawRow[], sourceColumns: string[]): Promise<ExtractionResult> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(rows, sourceColumns) },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AIServiceError("Empty response from AI provider");
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new AIServiceError("Invalid JSON response from AI provider");
      }

      const records = Array.isArray(parsed)
        ? parsed
        : (parsed as any).records
          || (parsed as any).data
          || Object.values(parsed as Record<string, unknown>).find((v) => Array.isArray(v))
          || [];
      const validated = extractedBatchSchema.safeParse(records);

      if (!validated.success) {
        console.error("AI output validation failed:", validated.error.issues);
        throw new AIServiceError("AI output failed validation", validated.error.issues);
      }

      const usage = response.usage;

      return {
        records: validated.data as ExtractedRecord[],
        usage: {
          promptTokens: usage?.prompt_tokens ?? 0,
          completionTokens: usage?.completion_tokens ?? 0,
          totalTokens: usage?.total_tokens ?? 0,
        },
      };
    } catch (err) {
      if (err instanceof AIServiceError) throw err;
      const message = err instanceof Error ? err.message : "Unknown AI error";
      throw new AIServiceError(`OpenAI-compatible API error: ${message}`, err);
    }
  }
}
