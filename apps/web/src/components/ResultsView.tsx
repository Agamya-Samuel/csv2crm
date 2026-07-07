"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Download, CheckCircle, XCircle, BarChart3, GripVertical } from "lucide-react";
import { useColumnResize, ResizeHandle } from "./useResizableColumns";
import type { CRMRecord } from "@/types";

interface ResultsViewProps {
  records: CRMRecord[];
  uploadId: string;
  onExport: () => void;
}

const crmColumns = [
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "crm_status",
  "crm_note",
  "data_source",
] as const;

const columnLabels: Record<string, string> = {
  name: "Name",
  email: "Email",
  country_code: "Country Code",
  mobile_without_country_code: "Mobile",
  company: "Company",
  city: "City",
  state: "State",
  country: "Country",
  crm_status: "Status",
  crm_note: "Notes",
  data_source: "Source",
};

export default function ResultsView({ records, uploadId, onExport }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState<"imported" | "skipped">("imported");

  const importedRecords = useMemo(
    () => records.filter((r) => r.status === "IMPORTED"),
    [records]
  );

  const skippedRecords = useMemo(
    () => records.filter((r) => r.status === "SKIPPED"),
    [records]
  );

  const activeRecords = activeTab === "imported" ? importedRecords : skippedRecords;

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Import Results
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload ID: {uploadId}
          </p>
        </div>
        <button
          onClick={onExport}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium
            rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {records.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Records</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {importedRecords.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Imported</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {skippedRecords.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Skipped</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("imported")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "imported"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Imported ({importedRecords.length})
        </button>
        <button
          onClick={() => setActiveTab("skipped")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "skipped"
              ? "border-yellow-500 text-yellow-600 dark:text-yellow-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Skipped ({skippedRecords.length})
        </button>
      </div>

      <p className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
        <GripVertical className="w-3.5 h-3.5" />
        Columns are resizable — drag header edges to resize
      </p>

      <RecordTable records={activeRecords} type={activeTab} />
    </div>
  );
}

function RecordTable({ records, type }: { records: CRMRecord[]; type: "imported" | "skipped" }) {
  const columnHelper = createColumnHelper<CRMRecord>();

  const columns = useMemo(() => {
    if (type === "skipped") {
      return [
        columnHelper.accessor("name", { header: "Name", cell: (info) => info.getValue() || "—", size: 160 }),
        columnHelper.accessor("email", { header: "Email", cell: (info) => info.getValue() || "—", size: 220 }),
        columnHelper.accessor("mobile_without_country_code", {
          header: "Mobile",
          cell: (info) => info.getValue() || "—",
          size: 140,
        }),
        columnHelper.accessor("skipReason", {
          header: "Skip Reason",
          cell: (info) => (
            <span className="text-yellow-600 dark:text-yellow-400">
              {info.getValue() || "—"}
            </span>
          ),
          size: 260,
        }),
      ];
    }

    return crmColumns.map((col) =>
      columnHelper.accessor(col, {
        header: columnLabels[col] || col,
        size: 160,
        minSize: 60,
        cell: (info) => {
          const value = info.getValue();
          if (col === "crm_status" && value) {
            const colors: Record<string, string> = {
              GOOD_LEAD_FOLLOW_UP: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
              DID_NOT_CONNECT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
              BAD_LEAD: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
              SALE_DONE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
            };
            return (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[value] || ""}`}>
                {value}
              </span>
            );
          }
          return value || "—";
        },
      })
    );
  }, [type, columnHelper]);

  const table = useReactTable({
    data: records,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
  });

  const { onMouseDown, onTouchStart } = useColumnResize(table);
  const { rows: tableRows } = table.getRowModel();
  const tableContainerRef = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => null,
    estimateSize: () => 40,
  });

  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No {type} records found.
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table
          className="w-full text-sm"
          style={{ width: table.getCenterTotalSize() }}
        >
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 w-12">
                  #
                </th>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="relative group/col px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 whitespace-nowrap"
                    style={{ width: header.getSize() }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanResize() && (
                      <ResizeHandle
                        onMouseDown={(e) => onMouseDown(e, header)}
                        onTouchStart={(e) => onTouchStart(e, header)}
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {tableRows.map((row, index) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap border-r border-gray-100 dark:border-gray-800 w-12">
                  {index + 1}
                </td>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap max-w-[200px] truncate"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
