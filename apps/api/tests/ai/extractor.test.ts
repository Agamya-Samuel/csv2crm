import { describe, it, expect } from "vitest";
import { extractedBatchSchema, extractedRecordSchema } from "../../src/utils/validation";

describe("AI Validation Schemas", () => {
  it("should validate a complete record", () => {
    const record = {
      created_at: "2026-05-13T14:20:48Z",
      name: "John Doe",
      email: "john.doe@example.com",
      country_code: "+91",
      mobile_without_country_code: "9876543210",
      company: "GrowEasy",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      lead_owner: "test@gmail.com",
      crm_status: "GOOD_LEAD_FOLLOW_UP",
      crm_note: "Client is asking to reschedule demo",
      data_source: "leads_on_demand",
      possession_time: null,
      description: null,
    };

    const result = extractedRecordSchema.safeParse(record);
    expect(result.success).toBe(true);
  });

  it("should validate a minimal record with nulls", () => {
    const record = {
      name: "John Doe",
      email: null,
      country_code: null,
      mobile_without_country_code: null,
      company: null,
      city: null,
      state: null,
      country: null,
      lead_owner: null,
      crm_status: null,
      crm_note: null,
      data_source: null,
      possession_time: null,
      description: null,
    };

    const result = extractedRecordSchema.safeParse(record);
    expect(result.success).toBe(true);
  });

  it("should reject invalid crm_status", () => {
    const record = {
      crm_status: "INVALID_STATUS",
    };

    const result = extractedRecordSchema.safeParse(record);
    expect(result.success).toBe(false);
  });

  it("should reject invalid data_source", () => {
    const record = {
      data_source: "invalid_source",
    };

    const result = extractedRecordSchema.safeParse(record);
    expect(result.success).toBe(false);
  });

  it("should validate a batch of records", () => {
    const batch = [
      { name: "John", email: "john@test.com" },
      { name: "Jane", email: "jane@test.com" },
    ];

    const result = extractedBatchSchema.safeParse(batch);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });
});
