import React from "react";
import Link from "next/link";

export type Category = { id: number; name: string; emoji: string; href: string };

export default function CategoriesSection({
  title = "หมวดหมู่ยอดนิยม",
  subtitle = "เลือกหมวดเพื่อดูประกาศที่เกี่ยวข้อง",
  viewAllHref = "/search",
  categories,
}: {
  title?: string;
  subtitle?: string;
  viewAllHref?: string;
  categories: Category[];
}) {
  return (
    <section className="mb-9">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900">{title}</h2>
          <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>
        </div>
        <Link href={viewAllHref} className="text-emerald-700 text-sm font-semibold hover:underline">
          ดูหมวดทั้งหมด
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={c.href}
            className="group bg-white rounded-2xl border border-zinc-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-emerald-50 grid place-items-center text-2xl">
                {c.emoji}
              </div>
              <div>
                <div className="font-semibold text-zinc-900 group-hover:text-emerald-700">{c.name}</div>
                <div className="text-xs text-zinc-500">ดูประกาศ</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}