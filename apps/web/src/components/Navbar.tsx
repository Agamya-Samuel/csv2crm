"use client";

import Link from "next/link";
import { ArrowLeft, Zap, Brain, ExternalLink, AlertCircle, List } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useAiCredits } from "@/lib/hooks";
import { formatTokens } from "@/lib/utils";
import type { AiCredits } from "@/types";

const PROVIDER_LABELS: Record<string, string> = {
  openrouter: "OpenRouter",
  openai: "OpenAI",
  gemini: "Gemini",
  claude: "Claude",
  xiaomimimo: "MIMO 2.5 Pro",
};

function formatModelLabel(provider: string, model: string): string {
  const base = PROVIDER_LABELS[provider];
  if (base) return base;
  return model.replace(/[/_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function AiCreditBadge({ credits }: { credits: AiCredits | null }) {
  if (!credits) return null;

  const label = formatModelLabel(credits.provider, credits.model);
  const lb = credits.liveBalance;
  const hasLiveBalance = lb.available;
  const tokenPlan = lb.tokenPlan;
  const currencySymbol = lb.currency === "CNY" ? "\u00a5" : "$";

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800
      border border-gray-200 dark:border-gray-700 text-sm">
      <Brain className="w-4 h-4 text-purple-500 dark:text-purple-400" />
      <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>

      {hasLiveBalance && tokenPlan && (
        <span className="text-green-600 dark:text-green-400 font-semibold">
          {formatTokens(tokenPlan.used)} / {formatTokens(tokenPlan.limit)} credits
        </span>
      )}

      {hasLiveBalance && !tokenPlan && typeof lb.balance === "number" && (
        <span className="text-green-600 dark:text-green-400 font-semibold">
          {currencySymbol}{lb.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )}

      {!hasLiveBalance && (
        <span className="text-gray-500 dark:text-gray-400">
          {formatTokens(credits.localUsage.totalTokens)} tokens
        </span>
      )}

      {hasLiveBalance === false && lb.error && credits.provider === "xiaomimimo" && (
        <span title={lb.error} className="flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[10px] text-amber-600 dark:text-amber-400 hidden sm:inline">
            {lb.error.includes("expired") ? "Session expired" : "Auth error"}
          </span>
        </span>
      )}

      {credits.provider === "xiaomimimo" && (
        <a
          href="https://platform.xiaomimimo.com/#/console/balance"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Open MiMo console"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}

interface NavbarProps {
  step: string;
  onReset: () => void;
  creditsRefreshKey?: number;
}

export default function Navbar({ step, onReset, creditsRefreshKey }: NavbarProps) {
  const { credits } = useAiCredits(creditsRefreshKey);

  return (
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
            <AiCreditBadge credits={credits} />
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
                onClick={onReset}
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
  );
}
