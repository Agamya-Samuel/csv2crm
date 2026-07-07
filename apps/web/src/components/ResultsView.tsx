"use client";

import { useState, useMemo, useCallback } from "react";
import { Download, CheckCircle, XCircle, BarChart3, Search, RefreshCw } from "lucide-react";
import type { CRMRecord } from "@/types";

interface ResultsViewProps {
  records: CRMRecord[];
  uploadId: string;
  onExport: () => void;
}

const PAGE_SIZE = 10;

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  GOOD_LEAD_FOLLOW_UP: { label: "Good Lead", className: "badge-good-lead" },
  SALE_DONE: { label: "Sale Done", className: "badge-sale-done" },
  DID_NOT_CONNECT: { label: "Did Not Connect", className: "badge-did-not-connect" },
  BAD_LEAD: { label: "Bad Lead", className: "badge-bad-lead" },
  NOT_DIALED: { label: "Not Dialed", className: "badge-not-dialed" },
};

function StatusBadge({ value }: { value: string | null }) {
  if (!value) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium badge-not-dialed">
        Not Dialed
      </span>
    );
  }
  const config = STATUS_CONFIG[value] ?? { label: value, className: "badge-not-dialed" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export default function ResultsView({ records, uploadId, onExport }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState<"imported" | "skipped">("imported");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const importedRecords = useMemo(() => records.filter((r) => r.status === "IMPORTED"), [records]);
  const skippedRecords = useMemo(() => records.filter((r) => r.status === "SKIPPED"), [records]);

  const activeRecords = activeTab === "imported" ? importedRecords : skippedRecords;

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return activeRecords;
    const q = searchQuery.toLowerCase();
    return activeRecords.filter(
      (r) =>
        r.email?.toLowerCase().includes(q) ||
        r.mobile_without_country_code?.includes(q) ||
        r.name?.toLowerCase().includes(q)
    );
  }, [activeRecords, searchQuery]);

  const visibleRecords = filteredRecords.slice(0, visibleCount);
  const hasMore = visibleCount < filteredRecords.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((c) => c + PAGE_SIZE);
  }, []);

  const handleTabChange = useCallback((tab: "imported" | "skipped") => {
    setActiveTab(tab);
    setVisibleCount(PAGE_SIZE);
    setSearchQuery("");
  }, []);

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Your Leads</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Monitor lead status, assign tasks, and close deals faster.
          </p>
        </div>
        <button
          onClick={onExport}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white
            bg-orange-500 hover:bg-orange-600 transition-all duration-200 shadow-md"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          value={records.length}
          label="Total Records"
          icon={<BarChart3 className="w-6 h-6 text-blue-500" />}
          color="text-gray-800 dark:text-gray-100"
        />
        <StatCard
          value={importedRecords.length}
          label="Imported"
          icon={<CheckCircle className="w-6 h-6 text-green-500" />}
          color="text-green-600 dark:text-green-400"
        />
        <StatCard
          value={skippedRecords.length}
          label="Skipped"
          icon={<XCircle className="w-6 h-6 text-yellow-500" />}
          color="text-yellow-600 dark:text-yellow-400"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-gray-700">
        <TabButton
          active={activeTab === "imported"}
          onClick={() => handleTabChange("imported")}
          label={`Imported (${importedRecords.length})`}
        />
        <TabButton
          active={activeTab === "skipped"}
          onClick={() => handleTabChange("skipped")}
          label={`Skipped (${skippedRecords.length})`}
        />
      </div>

      {/* Leads section header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Your Leads</h3>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Enter email or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700 rounded-xl
                text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent
                transition-all duration-200"
            />
          </div>
          <button
            onClick={() => setSearchQuery("")}
            title="Refresh / Clear search"
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700
              bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400
              hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {activeTab === "imported" ? (
            <ImportedTable records={visibleRecords as CRMRecord[]} />
          ) : (
            <SkippedTable records={visibleRecords as CRMRecord[]} />
          )}
        </div>
      </div>

      {/* No results */}
      {filteredRecords.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {searchQuery ? `No results matching "${searchQuery}"` : `No ${activeTab} records found.`}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            className="px-8 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300
              hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-200"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

/* ───────── Sub-components ───────── */

function StatCard({
  value,
  label,
  icon,
  color,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
        active
          ? "border-orange-500 text-orange-600 dark:text-orange-400"
          : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

function ImportedTable({ records }: { records: CRMRecord[] }) {
  return (
    <table className="w-full text-sm min-w-[900px]">
      <thead className="bg-gray-50 dark:bg-gray-800">
        <tr>
          {["LEAD NAME", "EMAIL", "CONTACT", "DATE CREATED", "COMPANY", "STATUS", "QUALITY", "SOURCE", "ACTIONS"].map(
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
        {records.map((record) => (
          <tr
            key={record.id}
            className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
          >
            <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
              {record.name || "—"}
            </td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">
              {record.email || "—"}
            </td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
              {record.country_code && record.mobile_without_country_code
                ? `+${record.country_code}${record.mobile_without_country_code}`
                : record.mobile_without_country_code || "—"}
            </td>
            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
              {formatDate(record.created_at)}
            </td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap max-w-[120px] truncate">
              {record.company || "—"}
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <StatusBadge value={record.crm_status} />
            </td>
            <td className="px-4 py-3 text-gray-400 dark:text-gray-500 whitespace-nowrap text-center text-xs italic">
              N/A
            </td>
            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap max-w-[80px] truncate text-xs">
              {record.data_source || "—"}
            </td>
            <td className="px-4 py-3 text-gray-400 dark:text-gray-500 whitespace-nowrap text-xs italic">
              —
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SkippedTable({ records }: { records: CRMRecord[] }) {
  return (
    <table className="w-full text-sm min-w-[600px]">
      <thead className="bg-gray-50 dark:bg-gray-800">
        <tr>
          {["NAME", "EMAIL", "CONTACT", "SKIP REASON"].map((col) => (
            <th
              key={col}
              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400
                uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 whitespace-nowrap"
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
        {records.map((record) => (
          <tr
            key={record.id}
            className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
          >
            <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
              {record.name || "—"}
            </td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">
              {record.email || "—"}
            </td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
              {record.mobile_without_country_code || "—"}
            </td>
            <td className="px-4 py-3 max-w-[300px]">
              <span className="text-yellow-600 dark:text-yellow-400 text-sm">
                {record.skipReason || "—"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
