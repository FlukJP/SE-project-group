"use client";

import { usePathname } from "next/navigation";
import { SidebarNavGroup } from "@/src/components/ui";

const navItems = [
    { key: "/admin", href: "/admin", label: "แดชบอร์ด", icon: "📊" },
    { key: "/admin/users", href: "/admin/users", label: "จัดการผู้ใช้", icon: "👥" },
    { key: "/admin/products", href: "/admin/products", label: "จัดการสินค้า", icon: "📦" },
    { key: "/admin/reports", href: "/admin/reports", label: "รายงาน", icon: "🚩" },
    { key: "/admin/categories", href: "/admin/categories", label: "หมวดหมู่", icon: "🏷️" },
] as const;

// Renders the sticky admin navigation sidebar with active-state highlighting
export default function AdminSidebar() {
    const pathname = usePathname();
    const activeKey =
        navItems.find((item) =>
            pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
        )?.key ?? "/admin";

    return (
        <SidebarNavGroup
            items={navItems}
            activeKey={activeKey}
            heading="ระบบจัดการ"
            className="h-fit sticky top-24"
        />
    );
}
