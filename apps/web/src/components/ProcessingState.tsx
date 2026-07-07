"use client";

import { Loader2, AlertCircle } from "lucide-react";
import type { UploadStatus } from "@/types";

interface ProcessingStateProps {
  status: UploadStatus | null;
  error: string | null;
}

const loadingTips = [
  "AI is analyzing column headers and mapping fields...",
  "Processing batches of records...",
  "Extracting contact information and lead details...",
  "Validating and structuring CRM data...",
  "Almost there — finalizing records...",
];

export default function ProcessingState({ status, error }: ProcessingStateProps) {
  if (error) {
    return (
      <div className="flex items-start justify-center py-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Processing Error
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-start justify-center py-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-10 text-center">
          <Loader2 className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Starting AI processing...</p>
        </div>
      </div>
    );
  }

  const progress =
    status.batchesTotal > 0
      ? Math.round((status.batchesDone / status.batchesTotal) * 100)
      : 0;

  const tipIndex = Math.min(
    Math.floor((status.batchesDone / Math.max(status.batchesTotal, 1)) * loadingTips.length),
    loadingTips.length - 1
  );

  return (
    <div className="flex items-start justify-center py-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          AI Processing in Progress
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {loadingTips[tipIndex]}
        </p>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 mb-3">
          <div
            className="bg-orange-500 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-6">
          <span>Batch {status.batchesDone} of {status.batchesTotal}</span>
          <span className="font-semibold text-orange-500">{progress}%</span>
        </div>

        {(status.importedCount > 0 || status.skippedCount > 0) && (
          <div className="flex justify-center gap-8 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {status.importedCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Imported</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {status.skippedCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Skipped</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
