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

// Renders a paginated data table with configurable columns and smart ellipsis page buttons
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
            <div className="text-center text-kd-text-light py-16">กำลังโหลด...</div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center text-kd-text-light py-16">{emptyText}</div>
        );
    }

    return (
        <div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-kd-border bg-kd-bg">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        "text-left px-4 py-3 font-semibold text-kd-text-light",
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
                                className="border-b border-kd-border hover:bg-kd-hover transition-colors"
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

            <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-kd-border">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-2 rounded-lg border text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed bg-white text-kd-text border-kd-border hover:border-kd-primary"
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
                                    <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-sm text-kd-text-light">
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => onPageChange(item as number)}
                                        className={`w-9 h-9 rounded-lg border text-sm font-medium transition ${
                                            page === item
                                                ? "bg-kd-primary text-white border-kd-primary"
                                                : "bg-white text-kd-text border-kd-border hover:border-kd-primary"
                                        }`}
                                    >
                                        {item}
                                    </button>
                                )
                            );
                    })()
                    : (
                        <button className="w-9 h-9 rounded-lg border text-sm font-medium bg-kd-primary text-white border-kd-primary" disabled>
                            {page}
                        </button>
                    )}

                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={total !== undefined ? page >= Math.ceil(total / limit) : data.length < limit}
                    className="px-3 py-2 rounded-lg border text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed bg-white text-kd-text border-kd-border hover:border-kd-primary"
                >
                    ถัดไป
                </button>
            </div>
        </div>
    );
}
