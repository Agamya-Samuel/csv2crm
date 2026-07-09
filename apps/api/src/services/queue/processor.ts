import { prisma } from "../../db/client";
import { createAIExtractor } from "../ai/factory";
import { normalizeCrmStatus, normalizeDataSource } from "../../utils/normalize";
import type { RawRow, ExtractedRecord } from "../../types";

const extractor = createAIExtractor();

export interface BatchJobData {
  batchId: string;
  uploadId: string;
  batchIndex: number;
  rows: RawRow[];
  columns: string[];
}

function hasContactInfo(record: ExtractedRecord): boolean {
  return !!(record.email || record.mobile_without_country_code);
}

function mapToLeadRecord(record: ExtractedRecord, rawRow: RawRow, uploadId: string) {
  let createdAtField: Date | null = null;
  if (record.created_at) {
    const d = new Date(record.created_at);
    if (!isNaN(d.getTime())) {
      createdAtField = d;
    }
  }

  const hasContact = hasContactInfo(record);

  return {
    uploadId,
    rawRow: rawRow as any,
    status: (hasContact ? "IMPORTED" : "SKIPPED") as "IMPORTED" | "SKIPPED",
    skipReason: hasContact ? null : "No email or mobile number found",
    createdAtField,
    name: record.name || null,
    email: record.email || null,
    countryCode: record.country_code || null,
    mobileWithoutCountryCode: record.mobile_without_country_code || null,
    company: record.company || null,
    city: record.city || null,
    state: record.state || null,
    country: record.country || null,
    leadOwner: record.lead_owner || null,
    crmStatus: normalizeCrmStatus(record.crm_status) as any,
    crmNote: record.crm_note || null,
    dataSource: normalizeDataSource(record.data_source) as any,
    possessionTime: record.possession_time || null,
    description: record.description || null,
  };
}

export async function processBatch(job: { data: BatchJobData }): Promise<{
  imported: number;
  skipped: number;
}> {
  const { batchId, uploadId, rows, columns } = job.data;

  await prisma.batch.update({
    where: { id: batchId },
    data: { status: "IN_PROGRESS" },
  });

  try {
    const { records: extracted, usage } = await extractor.extractBatch(rows, columns);

    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < extracted.length; i++) {
      const record = extracted[i];
      const rawRow = rows[i] || {};

      const leadData = mapToLeadRecord(record, rawRow, uploadId);

      await prisma.leadRecord.create({ data: leadData as any });

      if (leadData.status === "IMPORTED") {
        imported++;
      } else {
        skipped++;
      }
    }

    await prisma.aiUsage.create({
      data: {
        provider: process.env.AI_PROVIDER || "openrouter",
        model: process.env.AI_MODEL || "unknown",
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        uploadId,
        batchId,
      },
    });

    await prisma.batch.update({
      where: { id: batchId },
      data: { status: "SUCCESS" },
    });

    return { imported, skipped };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.batch.update({
      where: { id: batchId },
      data: {
        status: "FAILED",
        errorMessage: message,
        retryCount: { increment: 1 },
      },
    });
    throw err;
  }
}
