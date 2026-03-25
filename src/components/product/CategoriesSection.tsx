import Link from "next/link";
import { Category } from "@/src/data/categoriesData";

// Renders a grid of category cards with a header and a "view all" link
export default function CategoriesSection({
    title = "หมวดหมู่ยอดนิยม",
    subtitle = "เลือกหมวดเพื่อดูประกาศที่เกี่ยวข้อง",
    viewAllHref = "/search",
    categories,
}: {
    title?: string;
    subtitle?: string;
    viewAllHref?: string;
    categories: Category[];
}) {
    return (
        <section className="mb-9">
            <div className="flex items-end justify-between mb-4">
                <div>
                    <h2 className="text-xl font-extrabold text-kd-text">{title}</h2>
                    <p className="text-sm text-kd-text-light mt-1">{subtitle}</p>
                </div>
                <Link href={viewAllHref} className="text-kd-primary text-sm font-semibold hover:underline transition-colors">
                    ดูหมวดทั้งหมด
                </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {categories.map((c) => (
                    <Link
                        key={c.id ?? c.href}
                        href={c.href}
                        className="group bg-white rounded-2xl border border-kd-border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all kd-hover-card"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-2xl bg-kd-bg grid place-items-center text-2xl">
                                {c.emoji}
                            </div>
                            <div>
                                <div className="font-semibold text-kd-text group-hover:text-kd-primary transition-colors">{c.name}</div>
                                <div className="text-xs text-kd-text-light">ดูประกาศ</div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
