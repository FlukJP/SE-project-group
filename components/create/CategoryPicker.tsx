import React from "react";
import type { CreateCategory } from "@/components/categoriesData";

interface CategoryPickerProps {
  categories: CreateCategory[];
  onPick: (key: string) => void;
}

export default function CategoryPicker({ categories, onPick }: CategoryPickerProps) {
  return (
    <main className="min-h-[calc(100vh-120px)] bg-white">
      <div className="container mx-auto px-4 py-10">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-indigo-900">ลงประกาศใหม่</h1>
          <p className="text-zinc-600 mt-2">เลือกหมวดหมู่</p>
        </div>

        <div className="max-w-xl mx-auto mt-10 space-y-4">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => onPick(c.key)}
              className="w-full bg-zinc-100 hover:bg-zinc-200 border border-zinc-200
                         rounded-lg px-5 py-4 flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{c.emoji}</span>
                <span className="font-semibold text-indigo-900">{c.name}</span>
              </div>
              <span className="text-zinc-400 text-xl">›</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
