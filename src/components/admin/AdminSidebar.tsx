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
        <aside className="bg-white border border-kd-border rounded-xl p-4 h-fit sticky top-24">
            <div className="text-sm font-bold text-kd-primary mb-4 px-4">
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
                                    ? "bg-kd-card text-kd-text font-semibold"
                                    : "hover:bg-kd-hover text-kd-text"
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
