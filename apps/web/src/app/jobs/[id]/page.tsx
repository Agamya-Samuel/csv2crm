"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Zap,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Clock,
  Download,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import ProcessingState from "@/components/ProcessingState";
import ResultsView from "@/components/ResultsView";
import { useProcessingPoll, useRecords } from "@/lib/hooks";
import { getUploadStatus, getExportUrl } from "@/lib/api";
import type { UploadStatus } from "@/types";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: uploadId } = use(params);

  const [initialStatus, setInitialStatus] = useState<UploadStatus | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getUploadStatus(uploadId);
        if (!cancelled) {
          setInitialStatus(s);
        }
      } catch (err) {
        if (!cancelled) {
          setInitialError(err instanceof Error ? err.message : "Failed to load job");
        }
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [uploadId]);

  const shouldPoll =
    !initialLoading &&
    !initialError &&
    initialStatus?.status !== "DONE" &&
    initialStatus?.status !== "FAILED";

  const { status: polledStatus, error: pollError } = useProcessingPoll(
    uploadId,
    shouldPoll
  );

  const status = polledStatus || initialStatus;

  const { records, loading: recordsLoading, fetchRecords } = useRecords(uploadId);

  useEffect(() => {
    if (status?.status === "DONE") {
      fetchRecords();
    }
  }, [status?.status, fetchRecords]);

  const handleExport = useCallback(async () => {
    const url = await getExportUrl(uploadId);
    window.open(url, "_blank");
  }, [uploadId]);

  const statusBadge = (s: string) => {
    const configs: Record<string, { label: string; colors: string; icon: React.ReactNode }> = {
      PENDING: {
        label: "Pending",
        colors: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
        icon: <Clock className="w-3.5 h-3.5" />,
      },
      PARSING: {
        label: "Parsing",
        colors: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      },
      PROCESSING: {
        label: "Processing",
        colors: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      },
      DONE: {
        label: "Complete",
        colors: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        icon: <CheckCircle className="w-3.5 h-3.5" />,
      },
      FAILED: {
        label: "Failed",
        colors: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        icon: <XCircle className="w-3.5 h-3.5" />,
      },
    };
    const cfg = configs[s] || configs.PENDING;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${cfg.colors}`}
      >
        {cfg.icon}
        {cfg.label}
      </span>
    );
  };

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
                <ArrowLeft className="w-4 h-4" />
                All Jobs
              </Link>
              <Link
                href="/"
                className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400
                  hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
              >
                New Import
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {initialLoading && (
          <div className="text-center py-20">
            <Loader2 className="w-10 h-10 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500 dark:text-gray-400">Loading job details...</p>
          </div>
        )}

        {initialError && (
          <div className="text-center py-20">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Failed to Load Job
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-4">{initialError}</p>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-100
                dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Back to Jobs
            </Link>
          </div>
        )}

        {!initialLoading && !initialError && status && (
          <>
            <div className="mb-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-blue-500" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {status.fileName}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ID: {uploadId} •{" "}
                      {new Date(status.createdAt).toLocaleDateString()}{" "}
                      {new Date(status.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {statusBadge(status.status)}
                  {status.status === "DONE" && (
                    <button
                      onClick={handleExport}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium
                        rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  )}
                </div>
              </div>

              {status.status !== "PENDING" && status.batchesTotal > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Batches</p>
                      <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {status.batchesDone} / {status.batchesTotal}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Progress</p>
                      <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {status.batchesTotal > 0
                          ? Math.round((status.batchesDone / status.batchesTotal) * 100)
                          : 0}
                        %
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Imported</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {status.importedCount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Skipped</p>
                      <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                        {status.skippedCount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(status.status === "PROCESSING" || status.status === "PARSING") && (
              <ProcessingState status={status} error={pollError} />
            )}

            {status.status === "FAILED" && (
              <div className="text-center py-12">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Job Failed
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {pollError || "An error occurred during processing. Some batches may have failed."}
                </p>
              </div>
            )}

            {status.status === "DONE" && (
              <>
                {recordsLoading && (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-500 dark:text-gray-400">Loading results...</p>
                  </div>
                )}
                {records && (
                  <ResultsView
                    records={records.records}
                    uploadId={uploadId}
                    onExport={handleExport}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
