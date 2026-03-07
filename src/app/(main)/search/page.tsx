"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/src/components/layout/Navbar";
import ProductCard from "@/src/components/product/ProductCard";
import { productApi } from "@/src/lib/api";
import { ProductDisplay, toProductDisplay } from "@/src/types/ProductDisplay";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <>
          <Navbar />
          <div className="text-center py-16 text-zinc-500">กำลังโหลด...</div>
        </>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") || "";
  const province = searchParams.get("province") || "";
  const category = searchParams.get("cat") || "";

  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<ProductDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sync local query state when URL search param changes
  useEffect(() => {
    setQuery(q);
  }, [q]);

  // Fix #17: Show error state instead of silently swallowing errors
  useEffect(() => {
    setLoading(true);
    setError("");
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (province) params.province = province;
    if (category) params.category = category;

    productApi
      .list(params)
      .then((res) => setResults(res.data.map(toProductDisplay)))
      .catch((err) => {
        setResults([]);
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการค้นหา");
      })
      .finally(() => setLoading(false));
  }, [q, province, category]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (province) params.set("province", province);
    if (category) params.set("cat", category);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-zinc-50">
        <div className="bg-emerald-600">
          <div className="container mx-auto px-4 py-6">
            <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  🔎
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ค้นหาสินค้า..."
                  className="w-full rounded-xl border border-white/20 bg-white pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-white text-emerald-700 font-semibold px-6 py-3 text-sm hover:bg-zinc-50 transition"
              >
                ค้นหา
              </button>
            </form>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-zinc-900">
              {q ? (
                <>
                  ผลการค้นหา &quot;{q}&quot;
                  <span className="text-sm font-normal text-zinc-500 ml-2">
                    ({results.length} รายการ)
                  </span>
                </>
              ) : (
                "สินค้าทั้งหมด"
              )}
            </h1>
          </div>

          {loading ? (
            <div className="text-center text-zinc-500 py-16">กำลังค้นหา...</div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">&#9888;&#65039;</div>
              <p className="text-red-500">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 text-emerald-600 hover:underline text-sm"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} badgeText="" />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-zinc-500">ไม่พบสินค้าที่ค้นหา</p>
              <p className="text-sm text-zinc-400 mt-1">ลองค้นหาด้วยคำอื่น</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
