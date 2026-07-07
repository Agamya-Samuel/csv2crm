import Anthropic from "@anthropic-ai/sdk";
import { config } from "../../config";
import { AIServiceError } from "../../utils/errors";
import { extractedBatchSchema } from "../../utils/validation";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import type { AIExtractor, ExtractionResult } from "./AIExtractor";
import type { RawRow, ExtractedRecord } from "../../types";

export class ClaudeAdapter implements AIExtractor {
  private client: Anthropic;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.client = new Anthropic({ apiKey: apiKey || config.ANTHROPIC_API_KEY || "" });
    this.model = model || "claude-3-5-sonnet-20241022";
  }

  async extractBatch(rows: RawRow[], sourceColumns: string[]): Promise<ExtractionResult> {
    try {
      const prompt = buildUserPrompt(rows, sourceColumns);

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      });

      const content = message.content[0];
      if (content.type !== "text") {
        throw new AIServiceError("Unexpected response type from Claude");
      }

      let parsed: unknown;
      try {
        const jsonMatch = content.text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new AIServiceError("No JSON array found in Claude response");
        }
        parsed = JSON.parse(jsonMatch[0]);
      } catch (err) {
        if (err instanceof AIServiceError) throw err;
        throw new AIServiceError("Invalid JSON response from Claude");
      }

      const records = Array.isArray(parsed) ? parsed : [];
      const validated = extractedBatchSchema.safeParse(records);

      if (!validated.success) {
        console.error("Claude output validation failed:", validated.error.issues);
        throw new AIServiceError("Claude output failed validation", validated.error.issues);
      }

      const usage = message.usage;

      return {
        records: validated.data as ExtractedRecord[],
        usage: {
          promptTokens: usage.input_tokens,
          completionTokens: usage.output_tokens,
          totalTokens: usage.input_tokens + usage.output_tokens,
        },
      };
    } catch (err) {
      if (err instanceof AIServiceError) throw err;
      const message = err instanceof Error ? err.message : "Unknown Claude error";
      throw new AIServiceError(`Claude API error: ${message}`, err);
    }
  }
}
