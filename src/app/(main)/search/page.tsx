"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/src/components/layout/Navbar";
import ProductCard from "@/src/components/product/ProductCard";
import { productApi, categoryApi, type CategoryData } from "@/src/lib/api";
import { ProductDisplay, toProductDisplay } from "@/src/types/ProductDisplay";
import { useAuth } from "@/src/contexts/AuthContext";
import { PROVINCES } from "@/src/data/provinces";

type SortOption = "newest" | "price_asc" | "price_desc";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "ใหม่สุด",
  price_asc: "ราคาน้อย → มาก",
  price_desc: "ราคามาก → น้อย",
};

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
  const { user } = useAuth();

  const q = searchParams.get("q") || "";
  const province = searchParams.get("province") || "";
  const district = searchParams.get("district") || "";

  // Multi-category: parse comma-separated "cat" param
  const selectedCats = useMemo(() => {
    const catParam = searchParams.get("cat") || "";
    return catParam ? catParam.split(",").filter(Boolean) : [];
  }, [searchParams]);

  const [query, setQuery] = useState(q);
  const [debouncedQuery, setDebouncedQuery] = useState(q);
  const [results, setResults] = useState<ProductDisplay[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Categories
  const [categories, setCategories] = useState<CategoryData[]>([]);

  // Filter state
  const [showFilter, setShowFilter] = useState(false);
  const [sort, setSort] = useState<SortOption>("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load categories once on mount
  useEffect(() => {
    categoryApi.list().then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  // Sync input when URL param changes
  useEffect(() => {
    setQuery(q);
    setDebouncedQuery(q);
  }, [q]);

  // Debounce query input
  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value);
    }, 400);
  };

  // Fetch results — category filtering is done client-side
  useEffect(() => {
    setLoading(true);
    setError("");
    const params: Record<string, string> = { limit: "9999" };
    if (debouncedQuery.trim()) params.q = debouncedQuery.trim();
    if (province) params.province = province;
    if (district) params.district = district;

    productApi
      .list(params)
      .then((res) => {
        setResults(res.data.map(toProductDisplay));
        setTotal(res.meta.total);
      })
      .catch((err) => {
        setResults([]);
        setTotal(0);
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการค้นหา");
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery, province, district]);

  // Build URL with updated params
  const buildUrl = (overrides: { q?: string; cats?: string[]; province?: string; district?: string }) => {
    const params = new URLSearchParams();
    const newQ = overrides.q !== undefined ? overrides.q : query.trim();
    const newCats = overrides.cats !== undefined ? overrides.cats : selectedCats;
    const newProvince = overrides.province !== undefined ? overrides.province : province;
    const newDistrict = overrides.district !== undefined ? overrides.district : (overrides.province !== undefined ? "" : district);
    if (newQ) params.set("q", newQ);
    if (newProvince) params.set("province", newProvince);
    if (newDistrict && newProvince) params.set("district", newDistrict);
    if (newCats.length > 0) params.set("cat", newCats.join(","));
    return `/search?${params.toString()}`;
  };

  const navigate = (overrides: { q?: string; cats?: string[]; province?: string; district?: string }) => {
    router.push(buildUrl(overrides));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ q: query.trim() });
  };

  // Toggle a category in/out of selection
  const toggleCategory = (key: string) => {
    const next = selectedCats.includes(key)
      ? selectedCats.filter((k) => k !== key)
      : [...selectedCats, key];
    navigate({ cats: next });
  };

  const clearFilters = () => {
    setSort("newest");
    setMinPrice("");
    setMaxPrice("");
    navigate({ cats: [], province: "", district: "" });
  };

  const hasActiveFilter =
    sort !== "newest" || minPrice !== "" || maxPrice !== "" || selectedCats.length > 0 || province !== "" || district !== "";

  const filterCount = [
    sort !== "newest",
    minPrice !== "",
    maxPrice !== "",
    selectedCats.length > 0,
    province !== "",
    district !== "",
  ].filter(Boolean).length;

  // Apply client-side filters
  const filteredResults = useMemo(() => {
    let list = [...results];

    // Filter out own products
    if (user?.User_ID) {
      list = list.filter((p) => p.seller.id !== String(user.User_ID));
    }

    // Multi-category filter (client-side)
    if (selectedCats.length > 0) {
      list = list.filter((p) => selectedCats.includes(p.categoryKey));
    }

    const min = minPrice !== "" ? Number(minPrice) : null;
    const max = maxPrice !== "" ? Number(maxPrice) : null;
    if (min !== null) list = list.filter((p) => p.price >= min);
    if (max !== null) list = list.filter((p) => p.price <= max);
    if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
    return list;
  }, [results, sort, minPrice, maxPrice, selectedCats, user]);

  // Header title
  const headerTitle = useMemo(() => {
    if (selectedCats.length === 1) {
      const catName =
        categories.find((c) => c.category_key === selectedCats[0])?.name || selectedCats[0];
      return `หมวด: ${catName}`;
    }
    if (selectedCats.length > 1) return `${selectedCats.length} หมวดหมู่`;
    if (debouncedQuery) return `ผลการค้นหา "${debouncedQuery}"`;
    return "สินค้าทั้งหมด";
  }, [selectedCats, categories, debouncedQuery]);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-zinc-50">
        {/* Search bar */}
        <div className="bg-emerald-600">
          <div className="container mx-auto px-4 py-6">
            <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">🔎</span>
                <input
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="พิมพ์ชื่อสินค้าที่ต้องการค้นหา..."
                  className="w-full rounded-xl border border-white/20 bg-white pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => handleQueryChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    ✕
                  </button>
                )}
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
          {/* Header + filter toggle */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-zinc-900">
              {headerTitle}
              {debouncedQuery && selectedCats.length > 0 && (
                <span className="text-zinc-500 font-normal"> · &quot;{debouncedQuery}&quot;</span>
              )}
              <span className="text-sm font-normal text-zinc-500 ml-2">
                ({Number(total).toLocaleString()} รายการ)
              </span>
            </h1>

            <button
              type="button"
              onClick={() => setShowFilter((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition ${
                hasActiveFilter
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-zinc-700 border-zinc-300 hover:border-emerald-400"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6 10a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm2 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              ตัวกรอง
              {hasActiveFilter && (
                <span className="bg-white text-emerald-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {filterCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter panel */}
          {showFilter && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 mb-5 shadow-sm space-y-5">

              {/* Province / District */}
              <div>
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">พื้นที่</div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    aria-label="เลือกจังหวัด"
                    value={province}
                    onChange={(e) => navigate({ province: e.target.value, district: "" })}
                    className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  >
                    <option value="">ทุกจังหวัด</option>
                    {PROVINCES.map((p) => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                  {province && (
                    <select
                      aria-label="เลือกอำเภอ"
                      value={district}
                      onChange={(e) => navigate({ district: e.target.value })}
                      className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    >
                      <option value="">ทุกอำเภอ</option>
                      {PROVINCES.find((p) => p.name === province)?.districts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Category — multi-select */}
              {categories.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                    หมวดหมู่
                    {selectedCats.length > 0 && (
                      <span className="ml-2 text-emerald-600 font-bold normal-case">
                        ({selectedCats.length} ที่เลือก)
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                      const isActive = selectedCats.includes(cat.category_key);
                      return (
                        <button
                          key={cat.category_key}
                          type="button"
                          onClick={() => toggleCategory(cat.category_key)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                            isActive
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-white text-zinc-700 border-zinc-300 hover:border-emerald-400"
                          }`}
                        >
                          {isActive && (
                            <svg className="w-3 h-3 shrink-0" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                          <span>{cat.emoji}</span>
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-6">
                {/* Sort */}
                <div className="flex-1">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                    เรียงตาม
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSort(key)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                          sort === key
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-zinc-700 border-zinc-300 hover:border-emerald-400"
                        }`}
                      >
                        {SORT_LABELS[key]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div className="flex-1">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                    ช่วงราคา (฿)
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      placeholder="ต่ำสุด"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                    <span className="text-zinc-400 shrink-0">–</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="สูงสุด"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                  </div>
                </div>
              </div>

              {hasActiveFilter && (
                <div className="pt-3 border-t border-zinc-100 flex justify-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm text-red-500 hover:underline font-medium"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Active filter chips */}
          {hasActiveFilter && !showFilter && (
            <div className="flex flex-wrap gap-2 mb-4">
              {/* Province / District chip */}
              {province && (
                <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                  📍 {province}{district && ` · ${district}`}
                  <button
                    type="button"
                    onClick={() => navigate({ province: "", district: "" })}
                    className="hover:text-emerald-900 ml-1"
                  >
                    ✕
                  </button>
                </span>
              )}
              {/* One chip per selected category */}
              {selectedCats.map((key) => {
                const cat = categories.find((c) => c.category_key === key);
                return (
                  <span
                    key={key}
                    className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full"
                  >
                    {cat?.emoji} {cat?.name || key}
                    <button
                      type="button"
                      onClick={() => toggleCategory(key)}
                      className="hover:text-emerald-900 ml-1"
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
              {sort !== "newest" && (
                <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                  {SORT_LABELS[sort]}
                  <button type="button" onClick={() => setSort("newest")} className="hover:text-emerald-900 ml-1">✕</button>
                </span>
              )}
              {minPrice !== "" && (
                <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                  ราคา ≥ {Number(minPrice).toLocaleString()} ฿
                  <button type="button" onClick={() => setMinPrice("")} className="hover:text-emerald-900 ml-1">✕</button>
                </span>
              )}
              {maxPrice !== "" && (
                <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                  ราคา ≤ {Number(maxPrice).toLocaleString()} ฿
                  <button type="button" onClick={() => setMaxPrice("")} className="hover:text-emerald-900 ml-1">✕</button>
                </span>
              )}
            </div>
          )}

          {/* Results */}
          {loading ? (
            <div className="text-center text-zinc-500 py-16">กำลังค้นหา...</div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">&#9888;&#65039;</div>
              <p className="text-red-500">{error}</p>
              <button type="button" onClick={() => window.location.reload()} className="mt-3 text-emerald-600 hover:underline text-sm">
                ลองใหม่อีกครั้ง
              </button>
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredResults.map((product) => (
                <ProductCard key={product.id} product={product} badgeText="" />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-zinc-500">ไม่พบสินค้าที่ค้นหา</p>
              <p className="text-sm text-zinc-400 mt-1">ลองค้นหาด้วยคำอื่น หรือปรับตัวกรอง</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
