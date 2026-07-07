import { describe, it, expect } from "vitest";
import { parseCSV } from "../../src/services/csv/parser";
import fs from "fs";
import path from "path";

function loadFixture(name: string): Buffer {
  return fs.readFileSync(path.join(__dirname, "../fixtures", name));
}

describe("CSV Parser", () => {
  it("should parse facebook-leads.csv correctly", async () => {
    const buffer = loadFixture("facebook-leads.csv");
    const result = await parseCSV(buffer);

    expect(result.columns.length).toBeGreaterThan(0);
    expect(result.rows.length).toBe(5);
    expect(result.columns).toContain("Full Name");
    expect(result.columns).toContain("Email Address");
    expect(result.rows[0]["Full Name"]).toBe("John Doe");
  });

  it("should parse google-ads.csv correctly", async () => {
    const buffer = loadFixture("google-ads.csv");
    const result = await parseCSV(buffer);

    expect(result.rows.length).toBe(4);
    expect(result.columns).toContain("Campaign Name");
    expect(result.columns).toContain("Email");
  });

  it("should handle messy-spreadsheet.csv with semicolons in fields", async () => {
    const buffer = loadFixture("messy-spreadsheet.csv");
    const result = await parseCSV(buffer);

    expect(result.rows.length).toBe(5);
    expect(result.columns).toContain("Lead Name");
  });

  it("should reject empty CSV", async () => {
    const buffer = Buffer.from("col1,col2\n");
    await expect(parseCSV(buffer)).rejects.toThrow("empty");
  });

  it("should handle BOM-prefixed CSV", async () => {
    const csv = "\uFEFFName,Email\nJohn,john@test.com";
    const buffer = Buffer.from(csv);
    const result = await parseCSV(buffer);

    expect(result.columns[0]).toBe("Name");
    expect(result.rows[0]["Name"]).toBe("John");
  });
});
