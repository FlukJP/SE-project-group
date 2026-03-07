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
  onPageChange: (page: number) => void;
  emptyText?: string;
}

export default function DataTable<T>({
  columns,
  data,
  loading,
  page,
  limit = 20,
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

      <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm border border-zinc-300 rounded-lg disabled:opacity-40 hover:bg-zinc-50 transition-colors"
        >
          ก่อนหน้า
        </button>
        <span className="text-sm text-zinc-500">หน้าที่ {page}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={data.length < limit}
          className="px-3 py-1.5 text-sm border border-zinc-300 rounded-lg disabled:opacity-40 hover:bg-zinc-50 transition-colors"
        >
          ถัดไป
        </button>
      </div>
    </div>
  );
}
