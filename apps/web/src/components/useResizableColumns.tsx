"use client";

import { useCallback, useRef, useEffect } from "react";
import type { Header, Table } from "@tanstack/react-table";

export function useColumnResize(table: Table<any>) {
  const resizingRef = useRef<{
    header: Header<any, unknown>;
    startX: number;
    startWidth: number;
  } | null>(null);

  const onMouseDown = useCallback(
    (e: React.MouseEvent, header: Header<any, unknown>) => {
      e.preventDefault();
      e.stopPropagation();
      resizingRef.current = {
        header,
        startX: e.clientX,
        startWidth: header.getSize(),
      };
    },
    []
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent, header: Header<any, unknown>) => {
      resizingRef.current = {
        header,
        startX: e.touches[0].clientX,
        startWidth: header.getSize(),
      };
    },
    []
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const { header, startX, startWidth } = resizingRef.current;
      const diff = e.clientX - startX;
      const newWidth = Math.max(startWidth + diff, 40);
      header.column.columnDef.size = newWidth;
      table.setColumnSizing((old) => ({
        ...old,
        [header.column.id]: newWidth,
      }));
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!resizingRef.current) return;
      const { header, startX, startWidth } = resizingRef.current;
      const diff = e.touches[0].clientX - startX;
      const newWidth = Math.max(startWidth + diff, 40);
      header.column.columnDef.size = newWidth;
      table.setColumnSizing((old) => ({
        ...old,
        [header.column.id]: newWidth,
      }));
    };

    const onEnd = () => {
      resizingRef.current = null;
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", onEnd);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [table]);

  return { onMouseDown, onTouchStart };
}

export function ResizeHandle({
  onMouseDown,
  onTouchStart,
}: {
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
}) {
  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onClick={(e) => e.stopPropagation()}
      className="absolute right-0 top-0 h-full w-3 cursor-col-resize select-none flex items-center justify-center group/handle"
      style={{ transform: "translateX(50%)" }}
    >
      <div className="w-0.5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 group-hover/handle:bg-blue-500 group-hover/handle:h-7 transition-all" />
    </div>
  );
}
