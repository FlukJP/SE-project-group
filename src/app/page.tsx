"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/src/components/layout/Navbar";
import LoginModal from "@/src/components/user/LoginModal";
import CategoriesSection from "@/src/components/product/CategoriesSection";
import { toPopularCategory } from "@/src/data/categoriesData";
import type { Category } from "@/src/data/categoriesData";
import SearchBar from "@/src/components/product/SearchBar";
import FeaturedSection from "@/src/components/product/FeaturedSection";
import { CategoriesSkeleton, ProductGridSkeleton } from "@/src/components/ui/Skeleton";
import { useAuth } from "@/src/contexts/AuthContext";
import { useProducts } from "@/src/hooks/useProducts";
import { usePopularCategories } from "@/src/hooks/useCategories";

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  // Key changes when user logs in → SWR auto-revalidates to exclude own listings
  const userId = user?.User_ID;
  const params = useMemo<Record<string, string>>(() => {
    const p: Record<string, string> = { limit: "20", sortBy: "Created_at" };
    if (userId) p.excludeSeller = String(userId);
    return p;
  }, [userId]);

  const { data: featured = [], isLoading: loading } = useProducts(params);
  const { data: popularCats = [] } = usePopularCategories();
  const categories: Category[] = popularCats.map(toPopularCategory);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const searchParams = new URLSearchParams();
    if (query.trim()) searchParams.set("q", query.trim());
    if (province) searchParams.set("province", province);
    router.push(`/search?${searchParams.toString()}`);
  };

  return (
    <main className="min-h-screen bg-kd-bg">
      <Navbar onLoginClick={() => setShowLogin(true)} />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/background.png')] bg-cover bg-center bg-no-repeat]" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

        <div className="relative container mx-auto px-4 py-12 md:py-16 text-white">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1.5 rounded-full text-xs mb-4">
              <span className="h-2 w-2 rounded-full bg-white/80" />
              ซื้อ-ขายง่าย • ค้นหาเร็ว • ใกล้บ้านคุณ
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              ตลาดออนไลน์ <span className="text-white/90">ที่คนไทยใช้ทุกวัน</span>
            </h1>
            <p className="mt-3 text-white/85 leading-relaxed">
              ค้นหาสินค้ามือสองและของใหม่แบบมั่นใจ — มีหมวดหมู่ครบ ราคาโดนใจ และประกาศใหม่ทุกวัน
            </p>
          </div>

          <SearchBar
            query={query}
            setQuery={setQuery}
            province={province}
            setProvince={setProvince}
            onSearch={onSearch}
          />
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <>
            <CategoriesSkeleton count={8} />
            <ProductGridSkeleton count={8} />
          </>
        ) : (
          <>
            <CategoriesSection categories={categories} />

            {featured.length > 0 ? (
              <FeaturedSection
                title="สินค้าแนะนำวันนี้"
                subtitle="ประกาศล่าสุด"
                products={featured}
              />
            ) : (
              <div className="text-center text-kd-text-light py-12">ยังไม่มีประกาศในขณะนี้</div>
            )}
          </>
        )}

        <div className="md:hidden mt-8 grid grid-cols-2 gap-3">
          <Link
            href="/products/create"
            className="text-center py-3 rounded-xl bg-kd-primary text-white font-semibold shadow-sm hover:bg-kd-primary-hover transition-colors"
          >
            ลงขาย
          </Link>
          <Link
            href="/profile"
            className="text-center py-3 rounded-xl border border-kd-border bg-white font-semibold text-kd-text shadow-sm hover:bg-kd-hover transition-colors"
          >
            โปรไฟล์
          </Link>
        </div>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
