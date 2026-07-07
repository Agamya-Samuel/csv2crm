"use client";

import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { GripVertical } from "lucide-react";
import { useColumnResize, ResizeHandle } from "./useResizableColumns";
import type { RawRow } from "@/types";

interface CsvPreviewTableProps {
  columns: string[];
  rows: RawRow[];
  onConfirm: () => void;
  isConfirming: boolean;
}

export default function CsvPreviewTable({
  columns,
  rows,
  onConfirm,
  isConfirming,
}: CsvPreviewTableProps) {
  const columnHelper = createColumnHelper<RawRow>();

  const tableColumns = useMemo(
    () =>
      columns.map((col) =>
        columnHelper.accessor(col, {
          header: col,
          cell: (info) => info.getValue() || "—",
          size: 180,
          minSize: 60,
        })
      ),
    [columns, columnHelper]
  );

  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
  });

  const { onMouseDown, onTouchStart } = useColumnResize(table);
  const { rows: tableRows } = table.getRowModel();

  const parentRef = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => null,
    estimateSize: () => 40,
  });

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            CSV Preview
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {rows.length} rows × {columns.length} columns
          </p>
          <p className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <GripVertical className="w-3.5 h-3.5" />
            Columns are resizable — drag header edges to resize
          </p>
        </div>
        <button
          onClick={onConfirm}
          disabled={isConfirming}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
            text-white font-medium rounded-lg transition-colors duration-200
            flex items-center gap-2"
        >
          {isConfirming ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Processing...
            </>
          ) : (
            "Confirm Import"
          )}
        </button>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
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
    </div>
  );
}
