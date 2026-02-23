'use client'

import Link from 'next/link'

export default function Navbar({
  isLoggedIn = true,
  onProfileClick,
}: {
  isLoggedIn?: boolean
  onProfileClick?: () => void
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-zinc-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white grid place-items-center font-extrabold">
            K
          </div>
          <div className="font-extrabold">Kaidee-like</div>
          <div className="text-[11px] text-zinc-500 -mt-0.5">ตลาดมือสองใกล้คุณ</div>
        </Link>

        <div className="flex items-center gap-3">
          {isLoggedIn && (
            <>
              <Link href="/chat" className="p-2 hover:bg-zinc-100 rounded-full">
                💬
              </Link>

              <button
                onClick={onProfileClick}
                className="h-9 w-9 rounded-full bg-zinc-200 grid place-items-center hover:bg-zinc-300"
              >
                👤
              </button>

              <Link
                href="/products/create"
                className="px-4 py-2 rounded-lg bg-blue-900 text-white text-sm font-semibold"
              >
                ลงขาย
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}