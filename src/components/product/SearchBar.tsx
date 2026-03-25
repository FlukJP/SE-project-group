"use client";

import type { FormEvent } from "react";
import { PROVINCES } from "@/src/data/provinces";

// Renders a search form with a keyword input, province selector, and hot-keyword shortcut buttons
export default function SearchBar({
    query,
    setQuery,
    province,
    setProvince,
    onSearch,
    hotKeywords = ["iPhone", "มอเตอร์ไซค์", "คอนโด", "โน้ตบุ๊ก", "เสื้อผ้า"],
}: {
    query: string;
    setQuery: (v: string) => void;
    province: string;
    setProvince: (v: string) => void;
    onSearch: (e: FormEvent) => void;
    hotKeywords?: string[];
}) {
    return (
        <div className="mt-7 bg-white text-kd-text rounded-2xl p-4 md:p-5 shadow-xl shadow-kd-primary/10 border border-white/70">
            <form onSubmit={onSearch} className="grid grid-cols-1 md:grid-cols-[1fr_220px_140px] gap-3">
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-kd-text-light">🔎</span>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="ค้นหาสินค้า เช่น 'จักรยาน', 'iPhone', 'คอนโด'..."
                        className="w-full rounded-xl border border-kd-border pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-kd-primary/30 bg-white text-kd-text"
                    />
                </div>

                <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    aria-label="เลือกจังหวัด"
                    className="rounded-xl px-3 py-3 bg-white text-sm text-kd-text border border-kd-border focus:outline-none focus:ring-2 focus:ring-kd-primary/30"
                >
                    <option value="">ทุกจังหวัด</option>
                    {PROVINCES.map((p) => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                </select>

                <button
                    type="submit"
                    className="rounded-xl bg-kd-primary text-white text-sm font-semibold px-4 py-3 hover:bg-kd-primary-hover transition-colors"
                >
                    ค้นหา
                </button>
            </form>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-kd-text-light">
                <span className="font-semibold text-kd-text">ฮิต:</span>
                {hotKeywords.map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setQuery(t)}
                        className="px-2.5 py-1 rounded-full bg-kd-card hover:bg-kd-hover transition-colors text-kd-text"
                    >
                        {t}
                    </button>
                ))}
            </div>
        </div>
    );
}
