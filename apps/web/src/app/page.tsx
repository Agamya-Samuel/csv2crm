"use client";

import { useState, useCallback, useEffect } from "react";
import FileUploader from "@/components/FileUploader";
import CsvPreviewTable from "@/components/CsvPreviewTable";
import ProcessingState from "@/components/ProcessingState";
import ResultsView from "@/components/ResultsView";
import Navbar from "@/components/Navbar";
import JobCostSummary from "@/components/JobCostSummary";
import { useUpload, useConfirm, useProcessingPoll, useRecords } from "@/lib/hooks";
import { getExportUrl } from "@/lib/api";
import type { UploadResult } from "@/types";

type Step = "upload" | "preview" | "processing" | "results";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [uploadData, setUploadData] = useState<UploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [creditsRefreshKey, setCreditsRefreshKey] = useState(0);

  const { upload, uploading, error: uploadError, result, reset: resetUpload } = useUpload();
  const { confirm, confirming, error: confirmError } = useConfirm();
  const { status, error: pollError } = useProcessingPoll(
    uploadData?.uploadId || null,
    step === "processing"
  );
  const { records, loading: recordsLoading, fetchRecords } = useRecords(
    uploadData?.uploadId || null
  );

  useEffect(() => {
    if (result) {
      setUploadData(result);
      setStep("preview");
    }
  }, [result]);

  useEffect(() => {
    if (status?.status === "DONE") {
      fetchRecords();
      setStep("results");
      setCreditsRefreshKey((k) => k + 1);
    }
  }, [status?.status, fetchRecords]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setSelectedFile(file);
      await upload(file);
    },
    [upload]
  );

  const handleConfirm = useCallback(async () => {
    if (!uploadData) return;
    await confirm(uploadData.uploadId);
    setStep("processing");
  }, [uploadData, confirm]);

  const handleExport = useCallback(async () => {
    if (!uploadData) return;
    const url = await getExportUrl(uploadData.uploadId);
    window.open(url, "_blank");
  }, [uploadData]);

  const handleReset = useCallback(() => {
    setStep("upload");
    setUploadData(null);
    setSelectedFile(null);
    resetUpload();
  }, [resetUpload]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar step={step} onReset={handleReset} creditsRefreshKey={creditsRefreshKey} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {step === "upload" && (
          <FileUploader
            onFileSelect={handleFileSelect}
            isUploading={uploading}
            error={uploadError}
            onCancel={handleReset}
          />
        )}

        {step === "preview" && uploadData && (
          <CsvPreviewTable
            columns={uploadData.columns}
            rows={uploadData.previewRows}
            onConfirm={handleConfirm}
            isConfirming={confirming}
            onCancel={handleReset}
            fileName={selectedFile?.name ?? ""}
            fileSize={selectedFile?.size ?? 0}
          />
        )}

        {step === "processing" && (
          <ProcessingState status={status} error={pollError || confirmError} />
        )}

        {step === "results" && uploadData && (
          <>
            {status && (status.totalTokens ?? 0) > 0 && (
              <JobCostSummary
                totalTokens={status.totalTokens}
                promptTokens={status.promptTokens ?? 0}
                completionTokens={status.completionTokens ?? 0}
                estimatedCost={status.estimatedCost ?? 0}
              />
            )}
            <ResultsView
              records={records?.records || []}
              uploadId={uploadData.uploadId}
              onExport={handleExport}
            />
          </>
        )}

        {recordsLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading results...</p>
          </div>
        )}
      </main>
    </div>
  );
}
