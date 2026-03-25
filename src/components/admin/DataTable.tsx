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
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[#DCD0C0] bg-[#E6D5C3]">
                            {columns.map((col) => (
                                <th key={col.key} className={cn("px-4 py-3", col.className)}>
                                    <div className="animate-pulse h-3.5 bg-white rounded w-20" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 6 }).map((_, rowIdx) => (
                            <tr key={rowIdx} className="border-b border-[#DCD0C0]">
                                {columns.map((col) => (
                                    <td key={col.key} className={cn("px-4 py-3.5", col.className)}>
                                        <div className="animate-pulse h-3.5 bg-white rounded" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center text-[#A89F91] py-16">{emptyText}</div>
        );
    }

    return (
        <div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[#DCD0C0] bg-[#E6D5C3]">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        "text-left px-4 py-3 font-semibold text-[#4A3B32]",
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
                                className="border-b border-[#DCD0C0] hover:bg-[#F9F6F0] transition-colors"
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

            <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-[#DCD0C0]">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-2 rounded-lg border text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed bg-white text-[#4A3B32] border-[#DCD0C0] hover:border-[#D9734E]"
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
                                    <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-sm text-[#A89F91]">
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => onPageChange(item as number)}
                                        className={`w-9 h-9 rounded-lg border text-sm font-medium transition ${
                                            page === item
                                                ? "bg-[#D9734E] text-white border-[#D9734E]"
                                                : "bg-white text-[#4A3B32] border-[#DCD0C0] hover:border-[#D9734E]"
                                        }`}
                                    >
                                        {item}
                                    </button>
                                )
                            );
                    })()
                    : (
                        <button className="w-9 h-9 rounded-lg border text-sm font-medium bg-[#D9734E] text-white border-[#D9734E]" disabled>
                            {page}
                        </button>
                    )}

                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={total !== undefined ? page >= Math.ceil(total / limit) : data.length < limit}
                    className="px-3 py-2 rounded-lg border text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed bg-white text-[#4A3B32] border-[#DCD0C0] hover:border-[#D9734E]"
                >
                    ถัดไป
                </button>
            </div>
        </div>
    );
}
