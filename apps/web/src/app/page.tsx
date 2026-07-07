"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { FileSpreadsheet, ArrowLeft, Zap, List } from "lucide-react";
import FileUploader from "@/components/FileUploader";
import CsvPreviewTable from "@/components/CsvPreviewTable";
import ProcessingState from "@/components/ProcessingState";
import ResultsView from "@/components/ResultsView";
import ThemeToggle from "@/components/ThemeToggle";
import { useUpload, useConfirm, useProcessingPoll, useRecords } from "@/lib/hooks";
import { getExportUrl } from "@/lib/api";
import type { UploadResult, CRMRecord } from "@/types";

type Step = "upload" | "preview" | "processing" | "results";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [uploadData, setUploadData] = useState<UploadResult | null>(null);

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
    }
  }, [status?.status, fetchRecords]);

  const handleFileSelect = useCallback(
    async (file: File) => {
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
    resetUpload();
  }, [resetUpload]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  CSV2CRM
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  AI-Powered Lead Importer
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/jobs"
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400
                  hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1"
              >
                <List className="w-4 h-4" />
                All Jobs
              </Link>
              {step !== "upload" && (
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400
                    hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  New Import
                </button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {(["upload", "preview", "processing", "results"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                    ${step === s
                      ? "bg-blue-600 text-white"
                      : i < ["upload", "preview", "processing", "results"].indexOf(step)
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}
                >
                  {i + 1}
                </div>
                {i < 3 && (
                  <div
                    className={`w-12 h-0.5 ${
                      i < ["upload", "preview", "processing", "results"].indexOf(step)
                        ? "bg-green-500"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-16 mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Upload</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Preview</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Process</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Results</span>
          </div>
        </div>

        {step === "upload" && (
          <FileUploader
            onFileSelect={handleFileSelect}
            isUploading={uploading}
            error={uploadError}
          />
        )}

        {step === "preview" && uploadData && (
          <CsvPreviewTable
            columns={uploadData.columns}
            rows={uploadData.previewRows}
            onConfirm={handleConfirm}
            isConfirming={confirming}
          />
        )}

        {step === "processing" && (
          <ProcessingState status={status} error={pollError || confirmError} />
        )}

        {step === "results" && uploadData && (
          <ResultsView
            records={records?.records || []}
            uploadId={uploadData.uploadId}
            onExport={handleExport}
          />
        )}

        {recordsLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading results...</p>
          </div>
        )}
      </main>
    </div>
  );
}
