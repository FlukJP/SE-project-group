import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="container mx-auto px-4 py-8 text-sm text-zinc-600">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="font-semibold text-zinc-800">© {new Date().getFullYear()} Kaidee-like (Demo)</div>
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
