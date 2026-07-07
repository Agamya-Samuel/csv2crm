import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../db/client";
import { parseCSV } from "../services/csv/parser";
import { exportToCSV } from "../services/export";
import { aiExtractionQueue } from "../services/queue/bull";
import { upload } from "../middleware/upload";
import { NotFoundError, ValidationError } from "../utils/errors";
import { config } from "../config";
import type { BatchJobData } from "../services/queue/processor";

const router = Router();

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const uploads = await prisma.upload.findMany({
      include: {
        batches: true,
        records: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = uploads.map((u) => {
      const batchesDone = u.batches.filter(
        (b) => b.status === "SUCCESS" || b.status === "FAILED"
      ).length;
      const importedCount = u.records.filter((r) => r.status === "IMPORTED").length;
      const skippedCount = u.records.filter((r) => r.status === "SKIPPED").length;

      return {
        uploadId: u.id,
        fileName: u.fileName,
        totalRows: u.totalRows,
        status: u.status,
        createdAt: u.createdAt.toISOString(),
        batchesTotal: u.batches.length,
        batchesDone,
        importedCount,
        skippedCount,
      };
    });

    res.json({ uploads: result });
  } catch (err) {
    next(err);
  }
});

router.post("/", upload.single("file"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new ValidationError("No file uploaded");
    }

    const { columns, rows } = await parseCSV(req.file.buffer);

    const uploadRecord = await prisma.upload.create({
      data: {
        fileName: req.file.originalname,
        totalRows: rows.length,
        status: "PENDING",
      },
    });

    await prisma.leadRecord.createMany({
      data: rows.map((row: Record<string, string>) => ({
        uploadId: uploadRecord.id,
        rawRow: row as any,
        status: "PENDING" as const,
      })),
    });

    res.status(201).json({
      uploadId: uploadRecord.id,
      totalRows: rows.length,
      columns,
      previewRows: rows,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/:uploadId/confirm", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uploadId = req.params.uploadId as string;

    const uploadRecord = await prisma.upload.findUnique({ where: { id: uploadId } });
    if (!uploadRecord) {
      throw new NotFoundError("Upload not found");
    }

    if (uploadRecord.status !== "PENDING") {
      throw new ValidationError("Upload has already been processed");
    }

    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: "PROCESSING" },
    });

    const rawRecords = await prisma.leadRecord.findMany({
      where: { uploadId },
      orderBy: { id: "asc" },
    });

    const batchSize = config.BATCH_SIZE;
    const batchRecords: { id: string; batchIndex: number }[] = [];

    for (let i = 0; i < rawRecords.length; i += batchSize) {
      const batch = await prisma.batch.create({
        data: {
          uploadId,
          batchIndex: Math.floor(i / batchSize),
          status: "PENDING",
        },
      });
      batchRecords.push({ id: batch.id, batchIndex: batch.batchIndex });
    }

    for (const batch of batchRecords) {
      const startIdx = batch.batchIndex * batchSize;
      const batchRows = rawRecords.slice(startIdx, startIdx + batchSize);
      const firstRow = (batchRows[0]?.rawRow as Record<string, unknown>) || {};
      const columns = Object.keys(firstRow);

      const jobData: BatchJobData = {
        batchId: batch.id,
        uploadId,
        batchIndex: batch.batchIndex,
        rows: batchRows.map((r) => r.rawRow as unknown as Record<string, string>),
        columns,
      };

      await aiExtractionQueue.add("extract", jobData, {
        jobId: `${uploadId}-batch-${batch.batchIndex}`,
      });
    }

    res.json({
      uploadId,
      message: "Processing started",
      batchesTotal: batchRecords.length,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:uploadId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uploadId = req.params.uploadId as string;

    const uploadRecord = await prisma.upload.findUnique({
      where: { id: uploadId },
      include: {
        batches: true,
        records: { select: { status: true } },
      },
    });

    if (!uploadRecord) {
      throw new NotFoundError("Upload not found");
    }

    const batchesDone = uploadRecord.batches.filter(
      (b) => b.status === "SUCCESS" || b.status === "FAILED"
    ).length;

    const importedCount = uploadRecord.records.filter((r) => r.status === "IMPORTED").length;
    const skippedCount = uploadRecord.records.filter((r) => r.status === "SKIPPED").length;

    const allDone = uploadRecord.batches.length > 0 &&
      uploadRecord.batches.every((b) => b.status === "SUCCESS" || b.status === "FAILED");

    if (allDone && uploadRecord.status === "PROCESSING") {
      await prisma.upload.update({
        where: { id: uploadId },
        data: { status: "DONE" },
      });
    }

    res.json({
      uploadId: uploadRecord.id,
      fileName: uploadRecord.fileName,
      createdAt: uploadRecord.createdAt.toISOString(),
      status: allDone ? "DONE" : uploadRecord.status,
      batchesTotal: uploadRecord.batches.length,
      batchesDone,
      importedCount,
      skippedCount,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:uploadId/export", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uploadId = req.params.uploadId as string;

    const uploadRecord = await prisma.upload.findUnique({ where: { id: uploadId } });
    if (!uploadRecord) {
      throw new NotFoundError("Upload not found");
    }

    const csv = await exportToCSV(uploadId);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="crm-export-${uploadId}.csv"`
    );
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

router.get("/:uploadId/records", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uploadId = req.params.uploadId as string;

    const records = await prisma.leadRecord.findMany({
      where: { uploadId },
      orderBy: { name: "asc" },
    });

    res.json({
      records: records.map((r) => ({
        id: r.id,
        status: r.status,
        skipReason: r.skipReason,
        created_at: r.createdAtField?.toISOString() || null,
        name: r.name,
        email: r.email,
        country_code: r.countryCode,
        mobile_without_country_code: r.mobileWithoutCountryCode,
        company: r.company,
        city: r.city,
        state: r.state,
        country: r.country,
        lead_owner: r.leadOwner,
        crm_status: r.crmStatus,
        crm_note: r.crmNote,
        data_source: r.dataSource,
        possession_time: r.possessionTime,
        description: r.description,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
