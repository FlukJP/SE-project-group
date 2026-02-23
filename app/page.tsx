"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import LoginModal from '@/components/LoginModal';
import Profile from '@/components/Profile';

type Category = { id: number; name: string; emoji: string; href: string };
type Product = { id: number; title: string; price: string; img: string; location: string; timeAgo: string };

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("ทุกจังหวัด");
  const [isLoggedIn, setIsLoggedIn] = useState(true); // เปลี่ยนเป็น true เพื่อดูเมนูผู้ใช้
  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const categories: Category[] = [
    { id: 1, name: "รถยนต์", emoji: "🚗", href: "/search?cat=cars" },
    { id: 2, name: "มือถือ", emoji: "📱", href: "/search?cat=phones" },
    { id: 3, name: "บ้าน & ที่ดิน", emoji: "🏡", href: "/search?cat=property" },
    { id: 4, name: "แฟชั่น", emoji: "👗", href: "/search?cat=fashion" },
    { id: 5, name: "งาน", emoji: "💼", href: "/search?cat=jobs" },
    { id: 6, name: "คอมพิวเตอร์", emoji: "💻", href: "/search?cat=computers" },
    { id: 7, name: "เครื่องใช้ไฟฟ้า", emoji: "🔌", href: "/search?cat=appliances" },
    { id: 8, name: "กีฬา", emoji: "🏀", href: "/search?cat=sports" },
    { id: 9, name: "สัตว์เลี้ยง", emoji: "🐾", href: "/search?cat=pets" },
    { id: 10, name: "อื่น ๆ", emoji: "🧩", href: "/search?cat=others" },
  ];

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
        // ใช้รูป stable (ไม่เปลี่ยนทุกครั้ง) ลดแปลก ๆ ระหว่าง SSR/Client
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
    // ส่งไปหน้า search ของโปรเจกต์แก
    window.location.href = `/search?${params.toString()}`;
  };

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Top Nav */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-zinc-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white grid place-items-center font-extrabold">
              K
            </div>
            <div className="leading-tight">
              <div className="font-extrabold text-zinc-900">Kaidee-like</div>
              <div className="text-[11px] text-zinc-500 -mt-0.5">ตลาดมือสองใกล้คุณ</div>
            </div>
          </Link>

<div className="hidden md:flex items-center gap-3">
  {isLoggedIn ? (
    <>
      <button
        type="button"
        className="p-2 rounded-full hover:bg-zinc-100"
        aria-label="Favorites"
        title="รายการโปรด"
      >
        <span className="text-xl">♡</span>
      </button>

      <Link
        href="/chat"
        className="p-2 rounded-full hover:bg-zinc-100"
        aria-label="Chat"
        title="แชท"
      >
        <span className="text-xl">💬</span>
      </Link>

      <button
        onClick={() => setShowProfile(true)}
        className="h-9 w-9 rounded-full bg-zinc-200 grid place-items-center hover:bg-zinc-300"
        aria-label="Profile"
        title="โปรไฟล์"
      >
        <span className="text-sm">👤</span>
      </button>

      <Link
        href="/products/create"
        className="px-4 py-2 rounded-lg bg-blue-900 text-white text-sm font-semibold hover:opacity-95"
      >
        ลงขาย
      </Link>
    </>
  ) : (
    <>
      <button 
        onClick={() => setShowLogin(true)}
        className="text-sm font-semibold text-zinc-700 hover:underline"
      >
        เข้าสู่ระบบ
      </button>

      <button
        onClick={() => setShowLogin(true)}
        className="px-4 py-2 rounded-lg bg-blue-900 text-white text-sm font-semibold hover:opacity-95"
      >
        ลงขาย
      </button>
    </>
  )}
</div>
        </div>
      </header>

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
          <div className="mt-7 bg-white text-zinc-900 rounded-2xl p-4 md:p-5 shadow-xl shadow-emerald-900/10 border border-white/70">
            <form onSubmit={onSearch} className="grid grid-cols-1 md:grid-cols-[1fr_220px_140px] gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">🔎</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ค้นหาสินค้า เช่น 'จักรยาน', 'iPhone', 'คอนโด'..."
                  className="w-full rounded-xl border border-zinc-200 pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>

              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="rounded-xl px-3 py-3 bg-white text-sm text-zinc-700 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                <option>ทุกจังหวัด</option>
                <option>กรุงเทพ</option>
                <option>เชียงใหม่</option>
                <option>ชลบุรี</option>
                <option>ขอนแก่น</option>
              </select>

              <button
                type="submit"
                className="rounded-xl bg-emerald-600 text-white text-sm font-semibold px-4 py-3 hover:opacity-95"
              >
                ค้นหา
              </button>
            </form>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-600">
              <span className="font-semibold text-zinc-700">ฮิต:</span>
              {["iPhone", "มอเตอร์ไซค์", "คอนโด", "โน้ตบุ๊ก", "เสื้อผ้า"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setQuery(t)}
                  className="px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Categories */}
        <section className="mb-9">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-zinc-900">หมวดหมู่ยอดนิยม</h2>
              <p className="text-sm text-zinc-500 mt-1">เลือกหมวดเพื่อดูประกาศที่เกี่ยวข้อง</p>
            </div>
            <Link href="/search" className="text-emerald-700 text-sm font-semibold hover:underline">
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

        {/* Featured */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-zinc-900">ประกาศแนะนำ</h2>
              <p className="text-sm text-zinc-500 mt-1">ประกาศยอดนิยมวันนี้ (ตัวอย่าง)</p>
            </div>
            <Link href="/search" className="text-emerald-700 text-sm font-semibold hover:underline">
              ดูทั้งหมด
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {featured.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-zinc-200 hover:shadow-lg transition"
              >
                <div className="relative h-44">
                  <Image
                    src={p.img}
                    alt={p.title}
                    fill
                    className="object-cover group-hover:scale-[1.03] transition"
                    sizes="(max-width: 1024px) 100vw, 25vw"
                    priority={p.id <= 4}
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-[11px] font-semibold bg-white/95 border border-zinc-200 px-2 py-1 rounded-full">
                      ⭐ แนะนำ
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="line-clamp-2 font-semibold text-zinc-900 group-hover:text-emerald-700">
                    {p.title}
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-emerald-700 font-extrabold">{p.price}</div>
                    <span className="text-[11px] text-zinc-500">{p.timeAgo}</span>
                  </div>

                  <div className="mt-2 text-xs text-zinc-500">📍 {p.location}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Mobile actions */}
        <div className="md:hidden mt-8 grid grid-cols-2 gap-3">
          <Link href="/products/create" className="text-center py-3 rounded-xl bg-emerald-600 text-white font-semibold">
            ลงขาย
          </Link>
          <Link href="/profile" className="text-center py-3 rounded-xl border border-zinc-200 font-semibold text-zinc-800">
            โปรไฟล์
          </Link>
        </div>
      </div>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="container mx-auto px-4 py-8 text-sm text-zinc-600">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="font-semibold text-zinc-800">© {new Date().getFullYear()} Kaidee-like (Demo)</div>
            <div className="flex gap-4">
              <Link href="#" className="hover:underline">
                วิธีใช้งาน
              </Link>
              <Link href="#" className="hover:underline">
                ติดต่อเรา
              </Link>
              <Link href="#" className="hover:underline">
                ข้อกำหนด
              </Link>
            </div>
          </div>
        </div>
      </footer>
      
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showProfile && <Profile onClose={() => setShowProfile(false)} />}
    </main>
  );
}