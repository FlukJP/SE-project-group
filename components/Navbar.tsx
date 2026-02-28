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

  // --- เพิ่มเติม: State สำหรับเปิด/ปิดเมนู Dropdown โปรไฟล์ ---
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // ฟังก์ชันปิด Popover เมื่อคลิกพื้นที่อื่น (รวมถึงเมนูโปรไฟล์ด้วย)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // ปิดแชทถ้าคลิกข้างนอก
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsChatOpen(false)
      }
      // ปิดเมนูโปรไฟล์ถ้าคลิกข้างนอก
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
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
                  onClick={() => {
                    setIsChatOpen(!isChatOpen)
                    setIsProfileOpen(false) // ปิดเมนูโปรไฟล์เวลาเปิดแชท
                  }}
                  className="p-2 hover:bg-zinc-100 rounded-full transition-colors flex items-center justify-center text-xl"
                >
                  💬
                </button>

                {isChatOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[350px] h-[400px] bg-white rounded-lg shadow-2xl border border-gray-100 flex flex-col z-50 overflow-hidden cursor-default">
                    <div className="flex-1 flex flex-col items-center justify-center bg-white p-6">
                      <div className="w-24 h-24 mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="#273B8C" className="w-12 h-12">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">เริ่มพูดคุย</p>
                    </div>
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

              {/* --- เริ่มต้น: ส่วนเมนู Dropdown โปรไฟล์ --- */}
              <div className="relative inline-block" ref={profileRef}>
                <button
                  onClick={() => {
                    setIsProfileOpen(!isProfileOpen)
                    setIsChatOpen(false) // ปิดแชทเวลาเปิดเมนูโปรไฟล์
                  }}
                  className="h-9 w-9 rounded-full bg-zinc-200 grid place-items-center hover:bg-zinc-300 transition-colors"
                >
                  👤
                </button>

                {/* เมนู Dropdown จะแสดงเมื่อ isProfileOpen เป็น true */}
                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 flex flex-col z-50 py-2">
                    <Link href="/profile/edit" onClick={() => setIsProfileOpen(false)} className="px-5 py-2.5 text-[15px] text-gray-700 hover:bg-gray-50 hover:text-[#121E4D]">
                      ดูแลและแก้ไขข้อมูลส่วนตัว
                    </Link>
                    <Link href="/reviews" onClick={() => setIsProfileOpen(false)} className="px-5 py-2.5 text-[15px] text-gray-700 hover:bg-gray-50 hover:text-[#121E4D]">
                      รีวิวของฉัน
                    </Link>
                    <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="px-5 py-2.5 text-[15px] text-gray-700 hover:bg-gray-50 hover:text-[#121E4D]">
                      โปรไฟล์ของฉัน
                    </Link>
                    
                    {/* เมนูประวัติการใช้งานที่ลิงก์ไปหน้า /history ที่เราเพิ่งทำ */}
                    <Link href="/history" onClick={() => setIsProfileOpen(false)} className="px-5 py-2.5 text-[15px] text-gray-700 hover:bg-gray-50 hover:text-[#121E4D]">
                      ประวัติการใช้งาน
                    </Link>
                    
                    <Link href="/chat" onClick={() => setIsProfileOpen(false)} className="px-5 py-2.5 text-[15px] text-gray-700 hover:bg-gray-50 hover:text-[#121E4D]">
                      แชท
                    </Link>
                    <Link href="/favorites" onClick={() => setIsProfileOpen(false)} className="px-5 py-2.5 text-[15px] text-gray-700 hover:bg-gray-50 hover:text-[#121E4D]">
                      รายการโปรด
                    </Link>
                    
                    <div className="border-t border-gray-100 my-1"></div>
                    
                    <button onClick={() => { setIsProfileOpen(false); /* ใส่ฟังก์ชัน Log out ตรงนี้เพิ่มได้ */ }} className="text-left px-5 py-2.5 text-[15px] text-red-500 hover:bg-gray-50 transition-colors">
                      ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
              {/* --- จบส่วนเมนู Dropdown โปรไฟล์ --- */}

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