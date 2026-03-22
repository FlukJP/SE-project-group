import Link from "next/link";
import pkg from "@/package.json";

// Renders the site footer with copyright information and navigation links
export default function Footer() {
    return (
        <footer className="border-t border-zinc-200 bg-white">
            <div className="container mx-auto px-4 py-8 text-sm text-zinc-600">
                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="font-semibold text-zinc-800">© {new Date().getFullYear()} Kaidee-like (Demo)</span>
                        <span className="text-xs text-zinc-400 bg-zinc-100 rounded px-1.5 py-0.5">v{pkg.version}</span>
                    </div>
                    <div className="flex gap-4">
                        <Link href="#" className="hover:underline">
                            วิธีใช้งาน
                        </Link>
                        <Link href="#" className="hover:underline">
                            ติดต่อเรา
                        </Link>
                        <Link href="#" className="hover:underline">
                            ข้อกำหนด
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
