"use client";

import { cn } from "@/src/components/ui";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading: boolean;
  page: number;
  limit?: number;
  total?: number;
  onPageChange: (page: number) => void;
  emptyText?: string;
}

export default function DataTable<T>({
  columns,
  data,
  loading,
  page,
  limit = 20,
  total,
  onPageChange,
  emptyText = "ไม่มีข้อมูล",
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="text-center text-zinc-500 py-16">กำลังโหลด...</div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center text-zinc-500 py-16">{emptyText}</div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "text-left px-4 py-3 font-semibold text-zinc-600",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3", col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-zinc-200">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-2 rounded-lg border text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed bg-white text-zinc-700 border-zinc-300 hover:border-emerald-400"
        >
          ก่อนหน้า
        </button>

        {total !== undefined
          ? (() => {
              const totalPages = Math.ceil(total / limit);
              return Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "..." ? (
                    <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-sm text-zinc-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onPageChange(item as number)}
                      className={`w-9 h-9 rounded-lg border text-sm font-medium transition ${
                        page === item
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-zinc-700 border-zinc-300 hover:border-emerald-400"
                      }`}
                    >
                      {item}
                    </button>
                  )
                );
            })()
          : (
            <button className="w-9 h-9 rounded-lg border text-sm font-medium bg-emerald-600 text-white border-emerald-600" disabled>
              {page}
            </button>
          )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={total !== undefined ? page >= Math.ceil(total / limit) : data.length < limit}
          className="px-3 py-2 rounded-lg border text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed bg-white text-zinc-700 border-zinc-300 hover:border-emerald-400"
        >
          ถัดไป
        </button>
      </div>
    </div>
  );
}
