"use client";

import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { FileText, X } from "lucide-react";
import type { RawRow } from "@/types";

interface CsvPreviewTableProps {
  columns: string[];
  rows: RawRow[];
  onConfirm: () => void;
  isConfirming: boolean;
  onCancel: () => void;
  fileName: string;
  fileSize: number;
}

export default function CsvPreviewTable({
  columns,
  rows,
  onConfirm,
  isConfirming,
  onCancel,
  fileName,
  fileSize,
}: CsvPreviewTableProps) {
  const columnHelper = createColumnHelper<RawRow>();

  const tableColumns = useMemo(
    () =>
      columns.map((col) =>
        columnHelper.accessor(col, {
          header: col,
          cell: (info) => info.getValue() || "—",
          size: 160,
          minSize: 60,
        })
      ),
    [columns, columnHelper]
  );

  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: false,
  });

  const { rows: tableRows } = table.getRowModel();

  const fileSizeKb = (fileSize / 1024).toFixed(2);

  return (
    <div className="flex items-start justify-center py-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Import Leads via CSV
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Upload a CSV file to bulk import leads into your system.
          </p>
        </div>

        {/* Body */}
        <div className="px-8 pb-6">
          {/* File chip */}
          {fileName && (
            <div className="flex items-center gap-3 p-3 mb-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {fileName}
                </p>
                {fileSize > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{fileSizeKb} KB</p>
                )}
              </div>
              <button
                onClick={onCancel}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                title="Remove file"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </button>
            </div>
          )}

          {/* Preview table */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 whitespace-nowrap bg-gray-50 dark:bg-gray-800"
                          style={{ minWidth: header.getSize() }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                  {tableRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap max-w-[200px] truncate"
                          style={{ minWidth: cell.column.getSize() }}
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

          {/* Row count info */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
            Showing {rows.length} preview rows · {columns.length} columns
          </p>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
          <button
            onClick={onCancel}
            disabled={isConfirming}
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300
              hover:text-gray-900 dark:hover:text-white transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className="flex-1 max-w-[260px] px-6 py-2.5 rounded-xl text-sm font-semibold text-white
              transition-all duration-200 shadow-md
              disabled:opacity-40 disabled:cursor-not-allowed
              bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400
              flex items-center justify-center gap-2"
          >
            {isConfirming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Processing...
              </>
            ) : (
              "Upload File"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
