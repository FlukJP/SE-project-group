"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // 🌟 1. นำเข้า useRouter
import Navbar from "@/src/components/layout/Navbar";
import LoginModal from "@/src/components/user/LoginModal";
import Profile from "@/src/components/user/Profile";
import CategoriesSection from "@/src/components/product/CategoriesSection";
import { CATEGORIES } from "@/src/components/product/categoriesData";
import { Product } from "@/src/types/Product";
import SearchBar from "@/src/components/product/SearchBar";
import FeaturedSection from "@/src/components/product/FeaturedSection";

// 🌟 ย้ายข้อมูลคงที่ออกมาข้างนอก เพื่อให้ React ไม่ต้องสร้างตัวแปรใหม่ทุกครั้งที่ Render
const MOCK_LOCATIONS = ["กรุงเทพ", "นนทบุรี", "ปทุมธานี", "เชียงใหม่", "ชลบุรี", "ขอนแก่น"];
const MOCK_TIME_AGO = ["10 นาทีที่แล้ว", "40 นาทีที่แล้ว", "2 ชั่วโมงที่แล้ว", "เมื่อวานนี้", "3 วันที่แล้ว"];

export default function HomePage() {
  const router = useRouter(); // 🌟 เรียกใช้งาน Router
  const [isLoggedIn, setIsLoggedIn] = useState(true); // เปลี่ยนเป็น true เพื่อดูเมนูผู้ใช้
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("ทุกจังหวัด");
  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // 🌟 ใช้ Array.from เพื่อจำลองข้อมูล 12 รายการให้โค้ดดูคลีนขึ้น
const featured = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const basePrice = ((i + 1) * 34567) % 50000;
      return {
        id: String(i + 1),
        title: `สินค้าตัวอย่าง ${i + 1} • สภาพดี`,
        price: basePrice + 500,
        images: [
          `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=60&sig=${i}`,
        ],
        location: MOCK_LOCATIONS[i % MOCK_LOCATIONS.length],
        postedAt: MOCK_TIME_AGO[i % MOCK_TIME_AGO.length],
        description: "สินค้าตัวอย่าง สำหรับทดสอบการแสดงผล",
        categoryKey: "demo",
        seller: { id: "u-demo", name: "ผู้ขายตัวอย่าง" },
      } as unknown as Product; // 🌟 เติม as unknown as Product ตรงนี้เพื่อปิดแจ้งเตือน TypeScript
    });
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (province && province !== "ทุกจังหวัด") params.set("province", province);
    
    // 🌟 2. ใช้ router.push แทน window.location.href (ไม่รีเฟรชหน้าเว็บ)
    router.push(`/search?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Top Nav */}
      <Navbar
        isLoggedIn={isLoggedIn}
        onProfileClick={() => setShowProfile(true)}
        onLoginClick={() => setShowLogin(true)}
      />

      {/* Hero Section */}
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
            className="text-center py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-700 transition"
          >
            ลงขาย
          </Link>
          {/* 🌟 3. เปลี่ยนจาก Link ไปหน้า /profile ให้เรียก Modal Profile แทน เพื่อให้พฤติกรรมเหมือนปุ่มบน Navbar */}
          <button
            onClick={() => setShowProfile(true)}
            className="text-center py-3 rounded-xl border border-zinc-200 bg-white font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 transition"
          >
            โปรไฟล์
          </button>
        </div>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showProfile && <Profile onClose={() => setShowProfile(false)} />}
    </main>
  );
}