import Link from "next/link";
import pkg from "@/package.json";

// Renders the site footer with copyright information and navigation links
export default function Footer() {
    return (
        <footer className="border-t border-[#E6D5C3] bg-[#E6D5C3]">
            <div className="container mx-auto px-4 py-8 text-sm text-[#4A3B32]">
                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="font-semibold text-[#4A3B32]">© {new Date().getFullYear()} Kaidee-like (Demo)</span>
                        <span className="text-xs text-[#A89F91] bg-white rounded px-1.5 py-0.5">v{pkg.version}</span>
                    </div>
                    <div className="flex gap-4">
                        <Link href="#" className="hover:text-[#D9734E] transition-colors">
                            วิธีใช้งาน
                        </Link>
                        <Link href="#" className="hover:text-[#D9734E] transition-colors">
                            ติดต่อเรา
                        </Link>
                        <Link href="#" className="hover:text-[#D9734E] transition-colors">
                            ข้อกำหนด
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
