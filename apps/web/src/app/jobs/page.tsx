"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Zap,
  ArrowLeft,
  RefreshCw,
  Eye,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useUploads } from "@/lib/hooks";
import { formatTokens } from "@/lib/utils";
import type { UploadSummary } from "@/types";

const statusConfig: Record<
  string,
  { label: string; colors: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Pending",
    colors: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700",
    icon: <Clock className="w-3 h-3" />,
  },
  PARSING: {
    label: "Parsing",
    colors: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  PROCESSING: {
    label: "Processing",
    colors: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  DONE: {
    label: "Done",
    colors: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  FAILED: {
    label: "Failed",
    colors: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800",
    icon: <XCircle className="w-3 h-3" />,
  },
};

export default function JobsPage() {
  const { data, loading, error, refetch } = useUploads();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white dark:text-gray-900">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                  CSV2CRM
                </h1>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                  AI-Powered Lead Importer
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                  text-white bg-orange-500 hover:bg-orange-600 transition-all duration-200 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                New Import
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Title Block */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Jobs</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              View and manage all CSV import jobs
            </p>
          </div>
          <button
            onClick={refetch}
            className="px-3.5 py-2 text-sm text-gray-600 dark:text-gray-400
              hover:text-orange-600 dark:hover:text-orange-400 border border-gray-200
              dark:border-gray-700 rounded-xl flex items-center gap-2 bg-white
              dark:bg-gray-800 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {loading && (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <Loader2 className="w-10 h-10 text-orange-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500 dark:text-gray-400">Loading jobs...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400 mb-4 font-medium">{error}</p>
            <button
              onClick={refetch}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (!data || data.uploads.length === 0) && (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <FileSpreadsheet className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
              No jobs yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Upload a CSV file to get started
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600
                text-white font-semibold rounded-xl transition-colors shadow-md"
            >
              Upload CSV
            </Link>
          </div>
        )}

        {!loading && !error && data && data.uploads.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {["FILE NAME", "STATUS", "TOTAL ROWS", "PROGRESS", "IMPORTED", "SKIPPED", "TOKENS", "COST", "CREATED AT", "ACTIONS"].map(
                      (col) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400
                            uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 whitespace-nowrap"
                        >
                          {col}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.uploads.map((upload) => {
                    const cfg = statusConfig[upload.status] || statusConfig.PENDING;
                    const pct = upload.batchesTotal > 0 ? Math.round((upload.batchesDone / upload.batchesTotal) * 100) : 0;
                    const date = new Date(upload.createdAt);

                    return (
                      <tr
                        key={upload.uploadId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                      >
                        {/* File Name */}
                        <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200 max-w-[200px] truncate">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                            <span className="truncate">{upload.fileName}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.colors}`}>
                            {cfg.icon}
                            {cfg.label}
                          </span>
                        </td>

                        {/* Total Rows */}
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                          {upload.totalRows.toLocaleString()}
                        </td>

                        {/* Progress */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {upload.status === "PENDING" || upload.batchesTotal === 0 ? (
                            <span className="text-gray-400">—</span>
                          ) : (
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden border border-gray-200 dark:border-gray-700">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    upload.status === "FAILED" ? "bg-red-500" : "bg-orange-500"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {pct}%
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Imported */}
                        <td className="px-4 py-3 text-green-600 dark:text-green-400 font-semibold whitespace-nowrap">
                          {upload.importedCount.toLocaleString()}
                        </td>

                        {/* Skipped */}
                        <td className="px-4 py-3 text-yellow-600 dark:text-yellow-400 font-semibold whitespace-nowrap">
                          {upload.skippedCount.toLocaleString()}
                        </td>

                        {/* Tokens */}
                        <td className="px-4 py-3 text-purple-600 dark:text-purple-400 font-medium whitespace-nowrap">
                          {upload.totalTokens ? formatTokens(upload.totalTokens) : "—"}
                        </td>

                        {/* Cost */}
                        <td className="px-4 py-3 text-green-600 dark:text-green-400 font-semibold whitespace-nowrap">
                          {upload.estimatedCost ? `$${upload.estimatedCost < 0.01 ? upload.estimatedCost.toFixed(4) : upload.estimatedCost.toFixed(2)}` : "—"}
                        </td>

                        {/* Created At */}
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                          {date.toLocaleDateString()}{" "}
                          {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Link
                            href={`/jobs/${upload.uploadId}`}
                            className="text-sm font-semibold text-gray-600 dark:text-gray-400
                              hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex items-center gap-0.5"
                          >
                            More <span className="text-xs">&gt;</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
