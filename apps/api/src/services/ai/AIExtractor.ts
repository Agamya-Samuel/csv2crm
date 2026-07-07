import type { RawRow, ExtractedRecord } from "../../types";

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ExtractionResult {
  records: ExtractedRecord[];
  usage: TokenUsage;
}

export interface AIExtractor {
  extractBatch(rows: RawRow[], sourceColumns: string[]): Promise<ExtractionResult>;
}
