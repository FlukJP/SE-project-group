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

// Renders the sticky admin navigation sidebar with active-state highlighting
export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="bg-white border border-[#DCD0C0] rounded-xl p-4 h-fit sticky top-24">
            <div className="text-sm font-bold text-[#D9734E] mb-4 px-4">
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
                                    ? "bg-[#E6D5C3] text-[#4A3B32] font-semibold"
                                    : "hover:bg-[#F9F6F0] text-[#4A3B32]"
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
