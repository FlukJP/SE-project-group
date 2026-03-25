import Link from "next/link";

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    viewAllHref?: string;
    viewAllText?: string;
}

// Renders a section heading with an optional subtitle and a "view all" link
export default function SectionHeader({
    title,
    subtitle,
    viewAllHref = "/search",
    viewAllText = "ดูทั้งหมด",
}: SectionHeaderProps) {
    return (
        <div className="flex items-end justify-between mb-4">
            <div>
                <h2 className="text-xl font-extrabold text-[#4A3B32]">{title}</h2>
                {subtitle && <p className="text-sm text-[#A89F91] mt-1">{subtitle}</p>}
            </div>
            <Link
                href={viewAllHref}
                className="text-[#D9734E] text-sm font-semibold hover:underline transition-colors"
            >
                {viewAllText}
            </Link>
        </div>
    );
}
