"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import LoginModal from "@/components/LoginModal";
import Profile from "@/components/Profile";
import CategoriesSection from "@/components/CategoriesSection";
import { Product } from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import FeaturedSection from "@/components/FeaturedSection";
import { CATEGORIES } from "@/components/categoriesData";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("ทุกจังหวัด");
  const [isLoggedIn, setIsLoggedIn] = useState(true); // เปลี่ยนเป็น true เพื่อดูเมนูผู้ใช้
  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const featured: Product[] = useMemo(() => {
    const locs = ["กรุงเทพ", "นนทบุรี", "ปทุมธานี", "เชียงใหม่", "ชลบุรี", "ขอนแก่น"];
    const ago = ["10 นาทีที่แล้ว", "40 นาทีที่แล้ว", "2 ชั่วโมงที่แล้ว", "เมื่อวานนี้", "3 วันที่แล้ว"];
    return new Array(12).fill(0).map((_, i) => {
      const base = ((i + 1) * 34567) % 50000;
      const priceVal = base + 500;
      return {
        id: i + 1,
        title: `สินค้าตัวอย่าง ${i + 1} • สภาพดี`,
        price: `${priceVal.toFixed(0)} ฿`,
        img: `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=60&sig=${i}`,
        location: locs[i % locs.length],
        timeAgo: ago[i % ago.length],
      };
    });
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (province && province !== "ทุกจังหวัด") params.set("province", province);
    window.location.href = `/search?${params.toString()}`;
  };

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Top Nav */}
      <Navbar
        isLoggedIn={isLoggedIn}
        onProfileClick={() => setShowProfile(true)}
        onLoginClick={() => setShowLogin(true)}
      />

      {/* Hero */}
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

          {/* Search Card */}
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
        {/* ✅ Categories */}
        <CategoriesSection categories={CATEGORIES} />

        {/* Featured */}
        <FeaturedSection
          title="ประกาศแนะนำ"
          subtitle="ประกาศยอดนิยมวันนี้ (ตัวอย่าง)"
          products={featured}
        />

        {/* Mobile actions */}
        <div className="md:hidden mt-8 grid grid-cols-2 gap-3">
          <Link
            href="/products/create"
            className="text-center py-3 rounded-xl bg-emerald-600 text-white font-semibold"
          >
            ลงขาย
          </Link>
          <Link
            href="/profile"
            className="text-center py-3 rounded-xl border border-zinc-200 font-semibold text-zinc-800"
          >
            โปรไฟล์
          </Link>
        </div>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showProfile && <Profile onClose={() => setShowProfile(false)} />}
    </main>
  );
}