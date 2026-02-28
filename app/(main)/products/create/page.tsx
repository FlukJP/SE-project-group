"use client";

import { useRouter } from "next/navigation";
import { CREATE_CATEGORIES } from "@/components/categoriesData";

export default function CreatePage() {
  const router = useRouter();

  const go = (cat: string) => {
    // 🔧 เปลี่ยนปลายทางฟอร์มจริงได้
    // ตัวอย่าง: router.push(`/products/create/form?cat=${cat}`);
    router.push(`/products/create?cat=${cat}`);
  };

  return (
    <main className="min-h-[calc(100vh-120px)] bg-white">
      <div className="h-6" />

      <div className="container mx-auto px-4">
        {/* Title */}
        <div className="text-center mt-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-900">
            ลงประกาศใหม่
          </h1>
          <p className="text-zinc-600 mt-3">เลือกหมวดหมู่</p>
        </div>

        {/* List */}
        <div className="max-w-xl mx-auto mt-10 space-y-4">
          {CREATE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => go(c.key)}
              className="w-full bg-zinc-100 hover:bg-zinc-200 border border-zinc-200
                         rounded-lg px-5 py-4 flex items-center justify-between transition
                         focus:outline-none focus:ring-2 focus:ring-indigo-200"
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