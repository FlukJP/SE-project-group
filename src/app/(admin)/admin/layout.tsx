"use client";

import AdminGuard from "@/src/components/admin/AdminGuard";
import AdminSidebar from "@/src/components/admin/AdminSidebar";
import Link from "next/link";
import { useAuth } from "@/src/contexts/AuthContext";

export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <AdminGuard>
      <div className="min-h-screen bg-kd-bg">
        <header className="sticky top-0 z-30 bg-kd-bg/80 backdrop-blur border-b border-kd-border">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-kd-primary text-white grid place-items-center font-extrabold">
                K
              </div>
              <div className="font-extrabold">KMUTNB2Market</div>
              <span className="text-xs bg-kd-card text-kd-primary px-2 py-0.5 rounded-full font-semibold">
                Admin
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-kd-text-light hover:text-kd-text transition-colors"
              >
                กลับหน้าหลัก
              </Link>
              <span className="text-sm text-kd-text-light">{user?.Username}</span>
              <button
                onClick={logout}
                className="text-sm text-red-500 hover:text-red-700 transition-colors"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
            <AdminSidebar />
            <main className="bg-white border border-kd-border rounded-xl p-6 min-h-[600px]">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
