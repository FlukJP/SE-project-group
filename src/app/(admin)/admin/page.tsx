"use client";

import { useEffect, useState } from "react";
import StatCard from "@/src/components/admin/StatCard";
import { adminApi, categoryApi, productApi } from "@/src/lib/api";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalReports: 0,
    totalCategories: 0,
    bannedUsers: 0,
    bannedProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getUsers(1, 100),
      productApi.list({ limit: "100" }),
      adminApi.getReports(1, 100),
      categoryApi.list(),
      adminApi.getBannedUsers(1, 100),
      adminApi.getBannedProducts(1, 100),
    ])
      .then(([users, products, reports, categories, bannedUsers, bannedProducts]) => {
        setStats({
          totalUsers: users.data.length,
          totalProducts: products.data.length,
          totalReports: reports.data.length,
          totalCategories: categories.data.length,
          bannedUsers: bannedUsers.data.length,
          bannedProducts: bannedProducts.data.length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center text-zinc-500 py-16">กำลังโหลด...</div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-emerald-700 mb-6">แดชบอร์ด</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard emoji="👥" label="ผู้ใช้ทั้งหมด" value={stats.totalUsers} bgColor="bg-blue-50" />
        <StatCard emoji="📦" label="สินค้าทั้งหมด" value={stats.totalProducts} bgColor="bg-emerald-50" />
        <StatCard emoji="🚩" label="รายงานทั้งหมด" value={stats.totalReports} bgColor="bg-amber-50" />
        <StatCard emoji="🏷️" label="หมวดหมู่ทั้งหมด" value={stats.totalCategories} bgColor="bg-purple-50" />
        <StatCard emoji="🚫" label="ผู้ใช้ที่ถูกระงับ" value={stats.bannedUsers} bgColor="bg-red-50" />
        <StatCard emoji="⛔" label="สินค้าที่ถูกระงับ" value={stats.bannedProducts} bgColor="bg-orange-50" />
      </div>
    </div>
  );
}
