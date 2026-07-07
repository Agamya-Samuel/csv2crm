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
      <div className="w-full max-w-md mx-auto text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Processing Error
        </h3>
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="w-full max-w-md mx-auto text-center py-12">
        <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
        <p className="text-gray-600 dark:text-gray-400">Starting AI processing...</p>
      </div>
    );
  }

  const progress = status.batchesTotal > 0
    ? Math.round((status.batchesDone / status.batchesTotal) * 100)
    : 0;

  const tipIndex = Math.min(
    Math.floor((status.batchesDone / Math.max(status.batchesTotal, 1)) * loadingTips.length),
    loadingTips.length - 1
  );

  return (
    <div className="w-full max-w-md mx-auto text-center py-12">
      <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-6 animate-spin" />

      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
        AI Processing in Progress
      </h3>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {loadingTips[tipIndex]}
      </p>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
        <div
          className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          Batch {status.batchesDone} of {status.batchesTotal}
        </span>
        <span>{progress}%</span>
      </div>

      {(status.importedCount > 0 || status.skippedCount > 0) && (
        <div className="mt-6 flex justify-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {status.importedCount}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Imported</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {status.skippedCount}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Skipped</p>
          </div>
        </div>
      )}
    </div>
  );
}
