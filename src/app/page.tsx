"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/src/components/layout/Navbar";
import LoginModal from "@/src/components/user/LoginModal";
import CategoriesSection from "@/src/components/product/CategoriesSection";
import { toCategory, toPopularCategory } from "@/src/data/categoriesData";
import type { Category } from "@/src/data/categoriesData";
import { ProductDisplay, toProductDisplay } from "@/src/types/ProductDisplay";
import SearchBar from "@/src/components/product/SearchBar";
import FeaturedSection from "@/src/components/product/FeaturedSection";
import { productApi, categoryApi } from "@/src/lib/api";
import { useAuth } from "@/src/contexts/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [featured, setFeatured] = useState<ProductDisplay[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { limit: "20", sortBy: "random" };
    if (user?.User_ID) params.excludeSeller = String(user.User_ID);
    Promise.all([
      productApi.list(params).then((res) => res.data.map(toProductDisplay)),
      categoryApi.popular(10).then((res) => res.data.map(toPopularCategory))
        .catch(() => categoryApi.list().then((res) => res.data.map(toCategory))),
    ])
      .then(([products, cats]) => {
        setFeatured(products);
        setCategories(cats);
      })
      .catch(() => {
        setFeatured([]);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  const visibleFeatured = featured;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (province) params.set("province", province);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-zinc-50">
      <Navbar onLoginClick={() => setShowLogin(true)} />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-500" />
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
          <div className="text-center text-zinc-500 py-12">กำลังโหลดสินค้า...</div>
        ) : (
          <>
            <CategoriesSection categories={categories} />

            {visibleFeatured.length > 0 ? (
              <FeaturedSection
                title="สินค้าแนะนำวันนี้"
                subtitle="ประกาศล่าสุด"
                products={visibleFeatured}
              />
            ) : (
              <div className="text-center text-zinc-500 py-12">ยังไม่มีประกาศในขณะนี้</div>
            )}
          </>
        )}

        <div className="md:hidden mt-8 grid grid-cols-2 gap-3">
          <Link
            href="/products/create"
            className="text-center py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-700 transition"
          >
            ลงขาย
          </Link>
          <Link
            href="/profile"
            className="text-center py-3 rounded-xl border border-zinc-200 bg-white font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 transition"
          >
            โปรไฟล์
          </Link>
        </div>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
