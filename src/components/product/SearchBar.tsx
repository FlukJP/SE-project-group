"use client";

import React from "react";

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
  onSearch: (e: React.FormEvent) => void;
  hotKeywords?: string[];
}) {
  return (
    <div className="mt-7 bg-white text-zinc-900 rounded-2xl p-4 md:p-5 shadow-xl shadow-emerald-900/10 border border-white/70">
      <form onSubmit={onSearch} className="grid grid-cols-1 md:grid-cols-[1fr_220px_140px] gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">🔎</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาสินค้า เช่น 'จักรยาน', 'iPhone', 'คอนโด'..."
            className="w-full rounded-xl border border-zinc-200 pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>

        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="rounded-xl px-3 py-3 bg-white text-sm text-zinc-700 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        >
          <option>ทุกจังหวัด</option>
          <option>กรุงเทพ</option>
          <option>เชียงใหม่</option>
          <option>ชลบุรี</option>
          <option>ขอนแก่น</option>
        </select>

        <button
          type="submit"
          className="rounded-xl bg-emerald-600 text-white text-sm font-semibold px-4 py-3 hover:opacity-95"
        >
          ค้นหา
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-600">
        <span className="font-semibold text-zinc-700">ฮิต:</span>
        {hotKeywords.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setQuery(t)}
            className="px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}