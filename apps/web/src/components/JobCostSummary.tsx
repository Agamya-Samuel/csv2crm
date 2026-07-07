"use client";

import { Brain, DollarSign, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { formatTokens } from "@/lib/utils";

interface JobCostSummaryProps {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCost: number;
}

export default function JobCostSummary({
  totalTokens,
  promptTokens,
  completionTokens,
  estimatedCost,
}: JobCostSummaryProps) {
  if (totalTokens === 0) return null;

  return (
    <div className="mb-6 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-500" />
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          AI Usage Summary
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-1">
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <p className="text-xs">Input Tokens</p>
          </div>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {formatTokens(promptTokens)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {promptTokens.toLocaleString()}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-1">
            <ArrowUpFromLine className="w-3.5 h-3.5" />
            <p className="text-xs">Output Tokens</p>
          </div>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {formatTokens(completionTokens)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {completionTokens.toLocaleString()}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-1">
            <Brain className="w-3.5 h-3.5" />
            <p className="text-xs">Total Tokens</p>
          </div>
          <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
            {formatTokens(totalTokens)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {totalTokens.toLocaleString()}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            <p className="text-xs">Estimated Cost</p>
          </div>
          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
            ${estimatedCost < 0.01 ? estimatedCost.toFixed(4) : estimatedCost.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            based on provider rates
          </p>
        </div>
      </div>
    </div>
  );
}
