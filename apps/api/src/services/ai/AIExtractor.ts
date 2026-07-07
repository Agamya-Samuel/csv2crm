import type { RawRow, ExtractedRecord } from "../../types";

export interface AIExtractor {
  extractBatch(rows: RawRow[], sourceColumns: string[]): Promise<ExtractedRecord[]>;
}
