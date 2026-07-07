import { parse } from "csv-parse";
import { Readable } from "stream";
import { CSVParserError } from "../../utils/errors";
import type { RawRow } from "../../types";

export interface ParsedCSV {
  columns: string[];
  rows: RawRow[];
}

export async function parseCSV(buffer: Buffer): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    const rows: RawRow[] = [];
    let columns: string[] = [];

    const stream = Readable.from(buffer);

    const parser = stream.pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        relax_column_count: true,
        relax_quotes: true,
      })
    );

    parser.on("data", (record: RawRow) => {
      if (columns.length === 0) {
        columns = Object.keys(record);
      }
      rows.push(record);
    });

    parser.on("end", () => {
      if (rows.length === 0) {
        reject(new CSVParserError("CSV file is empty or has no valid rows"));
        return;
      }
      resolve({ columns, rows });
    });

    parser.on("error", (err: Error) => {
      reject(new CSVParserError(`Failed to parse CSV: ${err.message}`));
    });
  });
}
