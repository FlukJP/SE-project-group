"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/src/components/layout/Navbar";
import ProductCard from "@/src/components/product/ProductCard";
import {
  FormErrorNotice,
  getFilterChipClassName,
  getFilterChipRemoveButtonClassName,
  getFilterPanelClassName,
  getFormButtonClassName,
} from "@/src/components/ui";
import { ProductGridSkeleton } from "@/src/components/ui/Skeleton";
import { useAuth } from "@/src/contexts/AuthContext";
import { PROVINCES } from "@/src/data/provinces";
import { useProducts } from "@/src/hooks/useProducts";
import { useCategories } from "@/src/hooks/useCategories";
import { getFormFieldClassName } from "@/src/components/ui/formFieldStyles";

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
          <main className="min-h-screen bg-[#F9F6F0]">
            <div className="bg-[#D9734E] h-20" />
            <div className="container mx-auto px-4 py-6">
              <ProductGridSkeleton count={8} />
            </div>
          </main>
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
  const [page, setPage] = useState(1);

  const ITEMS_PER_PAGE = 20;

  // Filter state
  const [showFilter, setShowFilter] = useState(false);
  const [sort, setSort] = useState<SortOption>("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // SWR: categories loaded once and cached globally
  const { data: categories = [] } = useCategories();

  // Build product query params from current filter state
  const productParams = useMemo<Record<string, string>>(() => {
    const p: Record<string, string> = { limit: "9999" };
    if (debouncedQuery.trim()) p.q = debouncedQuery.trim();
    if (province) p.province = province;
    if (district) p.district = district;
    return p;
  }, [debouncedQuery, province, district]);

  // SWR: products — auto-refetches when productParams key changes
  const { data: results = [], isLoading: loading, error: fetchError } = useProducts(productParams);
  const error = fetchError instanceof Error ? fetchError.message : fetchError ? "เกิดข้อผิดพลาดในการค้นหา" : "";

  // Sync local input when URL param changes
  useEffect(() => {
    setQuery(q);
    setDebouncedQuery(q);
  }, [q]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(value), 400);
  };

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

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, province, district, selectedCats, minPrice, maxPrice, sort]);

  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);
  const pagedResults = filteredResults.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

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

      <main className="min-h-screen bg-[#F9F6F0]">
        {/* Search bar */}
        <div className="bg-[#D9734E]">
          <div className="container mx-auto px-4 py-6">
            <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89F91]">🔎</span>
                <input
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="พิมพ์ชื่อสินค้าที่ต้องการค้นหา..."
                  className={`${getFormFieldClassName({ size: "xl" })} border-white/20 pl-10 pr-3 py-3`}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => handleQueryChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A89F91] hover:text-[#4A3B32]"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="submit"
                className={`${getFormButtonClassName({ variant: "surfaceAccent", size: "lg" })} rounded-xl`}
              >
                ค้นหา
              </button>
            </form>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* Header + filter toggle */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-[#4A3B32]">
              {headerTitle}
              {debouncedQuery && selectedCats.length > 0 && (
                <span className="text-[#A89F91] font-normal"> · &quot;{debouncedQuery}&quot;</span>
              )}
              <span className="text-sm font-normal text-[#A89F91] ml-2">
                ({Number(filteredResults.length).toLocaleString()} รายการ)
              </span>
            </h1>

            <button
              type="button"
              onClick={() => setShowFilter((v) => !v)}
              className={`${getFormButtonClassName({
                variant: hasActiveFilter ? "primary" : "secondary",
                size: "md",
              })} rounded-xl gap-2`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6 10a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm2 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              ตัวกรอง
              {hasActiveFilter && (
                <span className="bg-white text-[#D9734E] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {filterCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter panel */}
          {showFilter && (
            <div className={getFilterPanelClassName()}>

              {/* Province / District */}
              <div>
                <div className="text-xs font-semibold text-[#A89F91] uppercase tracking-wide mb-2">พื้นที่</div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    aria-label="เลือกจังหวัด"
                    value={province}
                    onChange={(e) => navigate({ province: e.target.value, district: "" })}
                    className={`${getFormFieldClassName({ size: "lg" })} flex-1`}
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
                      className={`${getFormFieldClassName({ size: "lg" })} flex-1`}
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
                  <div className="text-xs font-semibold text-[#A89F91] uppercase tracking-wide mb-2">
                    หมวดหมู่
                    {selectedCats.length > 0 && (
                      <span className="ml-2 text-[#D9734E] font-bold normal-case">
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
                          className={getFilterChipClassName({ active: isActive })}
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
                  <div className="text-xs font-semibold text-[#A89F91] uppercase tracking-wide mb-2">
                    เรียงตาม
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSort(key)}
                        className={getFilterChipClassName({ active: sort === key })}
                      >
                        {SORT_LABELS[key]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div className="flex-1">
                  <div className="text-xs font-semibold text-[#A89F91] uppercase tracking-wide mb-2">
                    ช่วงราคา (฿)
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      placeholder="ต่ำสุด"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className={getFormFieldClassName({ size: "lg" })}
                    />
                    <span className="text-[#A89F91] shrink-0">–</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="สูงสุด"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className={getFormFieldClassName({ size: "lg" })}
                    />
                  </div>
                </div>
              </div>

              {hasActiveFilter && (
                <div className="pt-3 border-t border-[#E6D5C3] flex justify-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={getFormButtonClassName({ variant: "secondary", size: "sm" })}
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
                <span className={getFilterChipClassName({ tone: "summary", size: "sm" })}>
                  📍 {province}{district && ` · ${district}`}
                  <button
                    type="button"
                    onClick={() => navigate({ province: "", district: "" })}
                    className={getFilterChipRemoveButtonClassName()}
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
                    className={getFilterChipClassName({ tone: "summary", size: "sm" })}
                  >
                    {cat?.emoji} {cat?.name || key}
                    <button
                      type="button"
                      onClick={() => toggleCategory(key)}
                      className={getFilterChipRemoveButtonClassName()}
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
              {sort !== "newest" && (
                <span className={getFilterChipClassName({ tone: "summary", size: "sm" })}>
                  {SORT_LABELS[sort]}
                  <button type="button" onClick={() => setSort("newest")} className={getFilterChipRemoveButtonClassName()}>✕</button>
                </span>
              )}
              {minPrice !== "" && (
                <span className={getFilterChipClassName({ tone: "summary", size: "sm" })}>
                  ราคา ≥ {Number(minPrice).toLocaleString()} ฿
                  <button type="button" onClick={() => setMinPrice("")} className={getFilterChipRemoveButtonClassName()}>✕</button>
                </span>
              )}
              {maxPrice !== "" && (
                <span className={getFilterChipClassName({ tone: "summary", size: "sm" })}>
                  ราคา ≤ {Number(maxPrice).toLocaleString()} ฿
                  <button type="button" onClick={() => setMaxPrice("")} className={getFilterChipRemoveButtonClassName()}>✕</button>
                </span>
              )}
            </div>
          )}

          {/* Results */}
          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : error ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">&#9888;&#65039;</div>
              <FormErrorNotice message={error} className="max-w-md mx-auto" />
              <button type="button" onClick={() => window.location.reload()} className={`${getFormButtonClassName({ variant: "secondary", size: "md" })} mt-3`}>
                ลองใหม่อีกครั้ง
              </button>
            </div>
          ) : filteredResults.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {pagedResults.map((product) => (
                  <ProductCard key={product.id} product={product} badgeText="" />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 mt-8">
                  <button
                    type="button"
                    onClick={() => { setPage((p) => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    disabled={page <= 1}
                    className={getFormButtonClassName({ variant: "secondary", size: "md" })}
                  >
                    ก่อนหน้า
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === "..." ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-[#A89F91] select-none">…</span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => { setPage(item as number); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                          className={`${getFormButtonClassName({
                            variant: page === item ? "primary" : "secondary",
                            size: "md",
                          })} w-9 h-9 px-0`}
                        >
                          {item}
                        </button>
                      )
                    )}

                  <button
                    type="button"
                    onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    disabled={page >= totalPages}
                    className={getFormButtonClassName({ variant: "secondary", size: "md" })}
                  >
                    ถัดไป
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-[#A89F91]">ไม่พบสินค้าที่ค้นหา</p>
              <p className="text-sm text-[#A89F91] mt-1">ลองค้นหาด้วยคำอื่น หรือปรับตัวกรอง</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
