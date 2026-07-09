import { describe, it, expect } from "vitest";
import { extractedBatchSchema, extractedRecordSchema } from "../../src/utils/validation";
import { normalizeCrmStatus, normalizeDataSource } from "../../src/utils/normalize";

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

  it("should accept any string for crm_status (permissive schema)", () => {
    const record = {
      crm_status: "INVALID_STATUS",
    };

    const result = extractedRecordSchema.safeParse(record);
    expect(result.success).toBe(true);
  });

  it("should accept any string for data_source (permissive schema)", () => {
    const record = {
      data_source: "invalid_source",
    };

    const result = extractedRecordSchema.safeParse(record);
    expect(result.success).toBe(true);
  });

  it("should accept Facebook as data_source from AI output", () => {
    const record = {
      name: "John Doe",
      email: "john@example.com",
      data_source: "Facebook",
      crm_status: "Good Lead",
    };

    const result = extractedRecordSchema.safeParse(record);
    expect(result.success).toBe(true);
  });

  it("should accept freeform crm_status from AI output", () => {
    const record = {
      crm_status: "Good Lead",
    };

    const result = extractedRecordSchema.safeParse(record);
    expect(result.success).toBe(true);
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

  it("should validate a batch with non-enum status and source values", () => {
    const batch = [
      { name: "John", email: "john@test.com", crm_status: "Good Lead", data_source: "Facebook" },
      { name: "Jane", email: "jane@test.com", crm_status: "Did Not Connect", data_source: "Google Ads" },
      { name: "Bob", email: "bob@test.com", crm_status: "Follow Up", data_source: null },
    ];

    const result = extractedBatchSchema.safeParse(batch);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
  });
});

describe("normalizeCrmStatus", () => {
  it("should map exact enum values", () => {
    expect(normalizeCrmStatus("GOOD_LEAD_FOLLOW_UP")).toBe("GOOD_LEAD_FOLLOW_UP");
    expect(normalizeCrmStatus("DID_NOT_CONNECT")).toBe("DID_NOT_CONNECT");
    expect(normalizeCrmStatus("BAD_LEAD")).toBe("BAD_LEAD");
    expect(normalizeCrmStatus("SALE_DONE")).toBe("SALE_DONE");
  });

  it("should map freeform status values", () => {
    expect(normalizeCrmStatus("Good Lead")).toBe("GOOD_LEAD_FOLLOW_UP");
    expect(normalizeCrmStatus("Follow Up")).toBe("GOOD_LEAD_FOLLOW_UP");
    expect(normalizeCrmStatus("Did Not Connect")).toBe("DID_NOT_CONNECT");
    expect(normalizeCrmStatus("Bad Lead")).toBe("BAD_LEAD");
    expect(normalizeCrmStatus("Sale Done")).toBe("SALE_DONE");
    expect(normalizeCrmStatus("Not Interested")).toBe("BAD_LEAD");
    expect(normalizeCrmStatus("Closed")).toBe("SALE_DONE");
  });

  it("should handle case insensitivity", () => {
    expect(normalizeCrmStatus("good_lead")).toBe("GOOD_LEAD_FOLLOW_UP");
    expect(normalizeCrmStatus("BAD LEAD")).toBe("BAD_LEAD");
  });

  it("should return null for unrecognized values", () => {
    expect(normalizeCrmStatus("RANDOM_STATUS")).toBeNull();
    expect(normalizeCrmStatus("maybe")).toBeNull();
  });

  it("should return null for null/undefined/empty", () => {
    expect(normalizeCrmStatus(null)).toBeNull();
    expect(normalizeCrmStatus(undefined)).toBeNull();
    expect(normalizeCrmStatus("")).toBeNull();
  });
});

describe("normalizeDataSource", () => {
  it("should pass through allowed values", () => {
    expect(normalizeDataSource("leads_on_demand")).toBe("leads_on_demand");
    expect(normalizeDataSource("meridian_tower")).toBe("meridian_tower");
    expect(normalizeDataSource("eden_park")).toBe("eden_park");
    expect(normalizeDataSource("varah_swamy")).toBe("varah_swamy");
    expect(normalizeDataSource("sarjapur_plots")).toBe("sarjapur_plots");
  });

  it("should return null for non-allowed values", () => {
    expect(normalizeDataSource("Facebook")).toBeNull();
    expect(normalizeDataSource("Google Ads")).toBeNull();
    expect(normalizeDataSource("website")).toBeNull();
  });

  it("should return null for null/undefined/empty", () => {
    expect(normalizeDataSource(null)).toBeNull();
    expect(normalizeDataSource(undefined)).toBeNull();
    expect(normalizeDataSource("")).toBeNull();
  });
});
