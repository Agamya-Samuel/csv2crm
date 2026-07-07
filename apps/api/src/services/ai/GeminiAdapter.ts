import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../../config";
import { AIServiceError } from "../../utils/errors";
import { extractedBatchSchema } from "../../utils/validation";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import type { AIExtractor } from "./AIExtractor";
import type { RawRow, ExtractedRecord } from "../../types";

export class GeminiAdapter implements AIExtractor {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.genAI = new GoogleGenerativeAI(apiKey || config.GEMINI_API_KEY || "");
    this.model = model || "gemini-1.5-flash";
  }

  async extractBatch(rows: RawRow[], sourceColumns: string[]): Promise<ExtractedRecord[]> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.model,
        systemInstruction: SYSTEM_PROMPT,
      });

      const prompt = buildUserPrompt(rows, sourceColumns);
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      let parsed: unknown;
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new AIServiceError("No JSON array found in Gemini response");
        }
        parsed = JSON.parse(jsonMatch[0]);
      } catch (err) {
        if (err instanceof AIServiceError) throw err;
        throw new AIServiceError("Invalid JSON response from Gemini");
      }

      const records = Array.isArray(parsed) ? parsed : [];
      const validated = extractedBatchSchema.safeParse(records);

      if (!validated.success) {
        console.error("Gemini output validation failed:", validated.error.issues);
        throw new AIServiceError("Gemini output failed validation", validated.error.issues);
      }

      return validated.data as ExtractedRecord[];
    } catch (err) {
      if (err instanceof AIServiceError) throw err;
      const message = err instanceof Error ? err.message : "Unknown Gemini error";
      throw new AIServiceError(`Gemini API error: ${message}`, err);
    }
  }
}
