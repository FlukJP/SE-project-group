"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/src/components/ui";

const navItems = [
  { href: "/admin", label: "แดชบอร์ด", emoji: "📊" },
  { href: "/admin/users", label: "จัดการผู้ใช้", emoji: "👥" },
  { href: "/admin/products", label: "จัดการสินค้า", emoji: "📦" },
  { href: "/admin/reports", label: "รายงาน", emoji: "🚩" },
  { href: "/admin/categories", label: "หมวดหมู่", emoji: "🏷️" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-white border border-zinc-200 rounded-xl p-4 h-fit sticky top-24">
      <div className="text-sm font-bold text-emerald-700 mb-4 px-4">
        ระบบจัดการ
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-4 py-2.5 rounded-lg flex items-center gap-3 text-sm transition-colors",
                isActive
                  ? "bg-emerald-100 text-emerald-800 font-semibold"
                  : "hover:bg-zinc-50 text-zinc-700"
              )}
            >
              <span>{item.emoji}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
