"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
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
  GripVertical,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useColumnResize, ResizeHandle } from "@/components/useResizableColumns";
import { useUploads } from "@/lib/hooks";
import { formatTokens } from "@/lib/utils";
import type { UploadSummary } from "@/types";

const statusConfig: Record<
  string,
  { label: string; colors: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Pending",
    colors: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    icon: <Clock className="w-3 h-3" />,
  },
  PARSING: {
    label: "Parsing",
    colors: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  PROCESSING: {
    label: "Processing",
    colors: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  DONE: {
    label: "Done",
    colors: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  FAILED: {
    label: "Failed",
    colors: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: <XCircle className="w-3 h-3" />,
  },
};

export default function JobsPage() {
  const { data, loading, error, refetch } = useUploads();

  const columnHelper = createColumnHelper<UploadSummary>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("fileName", {
        header: "File Name",
        size: 220,
        minSize: 100,
        cell: (info) => (
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="truncate font-medium text-gray-800 dark:text-gray-200">
              {info.getValue()}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        size: 140,
        minSize: 100,
        cell: (info) => {
          const cfg = statusConfig[info.getValue()] || statusConfig.PENDING;
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.colors}`}
            >
              {cfg.icon}
              {cfg.label}
            </span>
          );
        },
      }),
      columnHelper.accessor("totalRows", {
        header: "Total Rows",
        size: 110,
        minSize: 80,
        cell: (info) => (
          <span className="text-gray-700 dark:text-gray-300">
            {info.getValue().toLocaleString()}
          </span>
        ),
      }),
      {
        id: "progress",
        header: "Progress",
        size: 160,
        minSize: 100,
        cell: ({ row }: { row: any }) => {
          const { batchesDone, batchesTotal, status } = row.original;
          if (status === "PENDING") return <span className="text-gray-400">—</span>;
          if (batchesTotal === 0) return <span className="text-gray-400">—</span>;
          const pct = Math.round((batchesDone / batchesTotal) * 100);
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    status === "FAILED" ? "bg-red-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {batchesDone}/{batchesTotal}
              </span>
            </div>
          );
        },
      } as any,
      columnHelper.accessor("importedCount", {
        header: "Imported",
        size: 100,
        minSize: 70,
        cell: (info) => (
          <span className="text-green-600 dark:text-green-400 font-medium">
            {info.getValue().toLocaleString()}
          </span>
        ),
      }),
      columnHelper.accessor("skippedCount", {
        header: "Skipped",
        size: 100,
        minSize: 70,
        cell: (info) => (
          <span className="text-yellow-600 dark:text-yellow-400 font-medium">
            {info.getValue().toLocaleString()}
          </span>
        ),
      }),
      columnHelper.accessor("totalTokens", {
        header: "Tokens",
        size: 120,
        minSize: 80,
        cell: (info) => {
          const val = info.getValue();
          if (!val) return <span className="text-gray-400">—</span>;
          return (
            <span className="text-purple-600 dark:text-purple-400 font-medium">
              {formatTokens(val)}
            </span>
          );
        },
      }),
      columnHelper.accessor("createdAt", {
        header: "Created At",
        size: 180,
        minSize: 120,
        cell: (info) => {
          const date = new Date(info.getValue());
          return (
            <span className="text-gray-500 dark:text-gray-400">
              {date.toLocaleDateString()}{" "}
              {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          );
        },
      }),
      {
        id: "actions",
        header: "",
        size: 80,
        minSize: 60,
        cell: ({ row }: { row: any }) => (
          <Link
            href={`/jobs/${row.original.uploadId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400
              hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </Link>
        ),
      } as any,
    ],
    [columnHelper]
  );

  const table = useReactTable({
    data: data?.uploads ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
  });

  const { onMouseDown, onTouchStart } = useColumnResize(table);
  const { rows: tableRows } = table.getRowModel();

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
                href="/"
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400
                  hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                New Import
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              All Jobs
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              View and manage all CSV import jobs
            </p>
          </div>
          <button
            onClick={refetch}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400
              hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200
              dark:border-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-50
              dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {loading && (
          <div className="text-center py-20">
            <Loader2 className="w-10 h-10 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500 dark:text-gray-400">Loading jobs...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={refetch}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (!data || data.uploads.length === 0) && (
          <div className="text-center py-20">
            <FileSpreadsheet className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No jobs yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Upload a CSV file to get started
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700
                text-white font-medium rounded-lg transition-colors"
            >
              Upload CSV
            </Link>
          </div>
        )}

        {!loading && !error && data && data.uploads.length > 0 && (
          <>
            <p className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <GripVertical className="w-3.5 h-3.5" />
              Columns are resizable — drag header edges to resize
            </p>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm table-fixed"
              >
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="relative group/col px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 whitespace-nowrap"
                          style={{ width: header.getSize() }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
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
                  {tableRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap"
                          style={{ width: cell.column.getSize() }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}
      </main>
    </div>
  );
}
