"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Play,
  Trash2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ProcessingState from "@/components/ProcessingState";
import ResultsView from "@/components/ResultsView";
import { useProcessingPoll, useRecords } from "@/lib/hooks";
import { getUploadStatus, getExportUrl, confirmUpload, deleteUpload } from "@/lib/api";
import { formatTokens } from "@/lib/utils";
import type { UploadStatus } from "@/types";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: uploadId } = use(params);
  const router = useRouter();

  const [initialStatus, setInitialStatus] = useState<UploadStatus | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const handleConfirm = useCallback(async () => {
    setConfirming(true);
    try {
      await confirmUpload(uploadId);
      const fresh = await getUploadStatus(uploadId);
      setInitialStatus(fresh);
    } catch (err) {
      setInitialError(err instanceof Error ? err.message : "Failed to start processing");
    } finally {
      setConfirming(false);
    }
  }, [uploadId]);

  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this job? This will remove all records and cannot be undone.")) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteUpload(uploadId);
      router.push("/jobs");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  }, [uploadId, router]);

  const statusBadge = (s: string) => {
    const configs: Record<string, { label: string; colors: string; icon: React.ReactNode }> = {
      PENDING: {
        label: "Pending",
        colors: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700",
        icon: <Clock className="w-3.5 h-3.5" />,
      },
      PARSING: {
        label: "Parsing",
        colors: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
        icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      },
      PROCESSING: {
        label: "Processing",
        colors: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
        icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      },
      DONE: {
        label: "Complete",
        colors: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800",
        icon: <CheckCircle className="w-3.5 h-3.5" />,
      },
      FAILED: {
        label: "Failed",
        colors: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800",
        icon: <XCircle className="w-3.5 h-3.5" />,
      },
    };
    const cfg = configs[s] || configs.PENDING;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${cfg.colors}`}
      >
        {cfg.icon}
        {cfg.label}
      </span>
    );
  };

  const handleReset = useCallback(() => {
    router.push("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar step="results" onReset={handleReset} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {initialLoading && (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <Loader2 className="w-10 h-10 text-orange-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500 dark:text-gray-400">Loading job details...</p>
          </div>
        )}

        {initialError && (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
              Failed to Load Job
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-4">{initialError}</p>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              Back to Jobs
            </Link>
          </div>
        )}

        {!initialLoading && !initialError && status && (
          <>
            {/* Job Summary Banner Card */}
            <div className="mb-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {status.fileName}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      ID: {uploadId} •{" "}
                      {new Date(status.createdAt).toLocaleDateString()}{" "}
                      {new Date(status.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {statusBadge(status.status)}
                  {status.status === "PENDING" && (
                    <button
                      onClick={handleConfirm}
                      disabled={confirming}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white font-semibold
                        rounded-xl transition-all duration-200 flex items-center gap-2 text-sm shadow-md"
                    >
                      {confirming ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      {confirming ? "Starting..." : "Continue Processing"}
                    </button>
                  )}
                  {status.status === "DONE" && (
                    <button
                      onClick={handleExport}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold
                        rounded-xl transition-all duration-200 flex items-center gap-2 text-sm shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold
                      rounded-xl transition-all duration-200 flex items-center gap-2 text-sm shadow-md"
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>

              {status.status !== "PENDING" && status.batchesTotal > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Batches</p>
                      <p className="text-base font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                        {status.batchesDone} / {status.batchesTotal}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Progress</p>
                      <p className="text-base font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                        {status.batchesTotal > 0
                          ? Math.round((status.batchesDone / status.batchesTotal) * 100)
                          : 0}
                        %
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Imported</p>
                      <p className="text-base font-bold text-green-600 dark:text-green-400 mt-0.5">
                        {status.importedCount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Skipped</p>
                      <p className="text-base font-bold text-yellow-600 dark:text-yellow-400 mt-0.5">
                        {status.skippedCount.toLocaleString()}
                      </p>
                    </div>
                    {(status.totalTokens ?? 0) > 0 && (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">AI Tokens</p>
                          <p className="text-base font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                            {formatTokens(status.totalTokens)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Est. Cost</p>
                          <p className="text-base font-bold text-green-600 dark:text-green-400 mt-0.5">
                            ${(status.estimatedCost ?? 0) < 0.01
                              ? (status.estimatedCost ?? 0).toFixed(4)
                              : (status.estimatedCost ?? 0).toFixed(2)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {(status.status === "PROCESSING" || status.status === "PARSING") && (
              <ProcessingState status={status} error={pollError} />
            )}

            {status.status === "FAILED" && (
              <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Job Failed
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {pollError || "An error occurred during processing. Some batches may have failed."}
                </p>
              </div>
            )}

            {status.status === "PENDING" && (
              <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Waiting to Process
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  This job has {status.totalRows?.toLocaleString() ?? 0} rows ready.
                  Click Continue Processing to start AI extraction.
                </p>
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white font-semibold
                    rounded-xl transition-all duration-200 flex items-center gap-2 mx-auto shadow-md"
                >
                  {confirming ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  {confirming ? "Starting..." : "Continue Processing"}
                </button>
              </div>
            )}

            {deleteError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
              </div>
            )}

            {status.status === "DONE" && (
              <>
                {recordsLoading && (
                  <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <Loader2 className="w-8 h-8 text-orange-500 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-500 dark:text-gray-400">Loading results...</p>
                  </div>
                )}
                {records && !recordsLoading && (
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
