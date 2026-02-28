import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllText?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  viewAllHref = "/search",
  viewAllText = "ดูทั้งหมด",
}: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-xl font-extrabold text-zinc-900">{title}</h2>
        {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
      </div>
      <Link
        href={viewAllHref}
        className="text-emerald-700 text-sm font-semibold hover:underline"
      >
        {viewAllText}
      </Link>
    </div>
  );
}
