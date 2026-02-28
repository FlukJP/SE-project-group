'use client'

import Link from 'next/link'
import React, { useState, useRef, useEffect } from 'react'

export default function Navbar({
  isLoggedIn = true,
  onProfileClick,
  onLoginClick,
}: {
  isLoggedIn?: boolean
  onProfileClick?: () => void
  onLoginClick?: () => void
}) {
  // State สำหรับเปิด/ปิดหน้าต่าง Popover แชท
  const [isChatOpen, setIsChatOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  // ฟังก์ชันปิด Popover เมื่อคลิกพื้นที่อื่น
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsChatOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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
          {isLoggedIn ? (
            <>
              {/* --- ส่วนไอคอนแชทและ Popover --- */}
              <div className="relative inline-block" ref={popoverRef}>
                <button
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className="p-2 hover:bg-zinc-100 rounded-full transition-colors flex items-center justify-center text-xl"
                >
                  💬
                </button>

                {/* หน้าต่าง Popover (จะแสดงเมื่อ isChatOpen เป็น true) */}
                {isChatOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[350px] h-[400px] bg-white rounded-lg shadow-2xl border border-gray-100 flex flex-col z-50 overflow-hidden cursor-default">
                    
                    {/* พื้นที่ตรงกลาง (รูปกล่องข้อความจำลอง) */}
                    <div className="flex-1 flex flex-col items-center justify-center bg-white p-6">
                      <div className="w-24 h-24 mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="#273B8C" className="w-12 h-12">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">เริ่มพูดคุย</p>
                    </div>

                    {/* ปุ่ม "ดูทั้งหมด" ด้านล่างสุด */}
                    <div className="border-t border-gray-100 p-4 text-center bg-white">
                      <Link
                        href="/chat"
                        onClick={() => setIsChatOpen(false)}
                        className="text-[#3b82f6] hover:text-blue-700 text-sm font-medium transition-colors"
                      >
                        ดูทั้งหมด
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              {/* --- จบส่วนไอคอนแชท --- */}

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
          ) : (
            <button
              onClick={onLoginClick}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
            >
              เข้าสู่ระบบ
            </button>
          )}
        </div>
      </div>
    </header>
  )
}