"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { API_BASE } from "@/src/lib/api";

// Renders the sticky top navigation bar with chat popover, profile dropdown, and login/logout actions
export default function Navbar({ onLoginClick }: { onLoginClick?: () => void }) {
    const router = useRouter();
    const { isLoggedIn, user, logout } = useAuth();
    const [isChatOpen, setIsChatOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Closes the chat and profile popovers when the user clicks outside either of them
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsChatOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Attempts logout and redirects to home; silently ignores API failures since client-side cleanup already happened in AuthContext
    const handleLogout = async () => {
        setIsProfileOpen(false);
        try {
            await logout();
        } catch {
            // logout API may fail but client-side cleanup already happened in AuthContext
        }
        router.push("/");
    };

    return (
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-kd-border">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-kd-primary text-white grid place-items-center font-extrabold">
                        K
                    </div>
                    <div className="font-extrabold text-kd-text">Kaidee-like</div>
                    <div className="text-[11px] text-kd-text-light -mt-0.5">ตลาดมือสองใกล้คุณ</div>
                </Link>

                <div className="flex items-center gap-3">
                    {isLoggedIn ? (
                        <>
                            <div className="relative inline-block" ref={popoverRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsChatOpen(!isChatOpen);
                                        setIsProfileOpen(false);
                                    }}
                                    className="p-2 hover:bg-kd-hover rounded-full transition-colors flex items-center justify-center text-xl"
                                >
                                    💬
                                </button>

                                {isChatOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-[350px] h-[400px] bg-white rounded-lg shadow-2xl border border-kd-border flex flex-col z-50 overflow-hidden cursor-default">
                                        <div className="flex-1 flex flex-col items-center justify-center bg-white p-6">
                                            <div className="w-24 h-24 mb-4 bg-kd-bg rounded-full flex items-center justify-center">
                                                <svg viewBox="0 0 24 24" fill="#D9734E" className="w-12 h-12">
                                                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-kd-text-light">เริ่มพูดคุย</p>
                                        </div>
                                        <div className="border-t border-kd-border p-4 text-center bg-white">
                                            <Link
                                                href="/chat"
                                                onClick={() => setIsChatOpen(false)}
                                                className="text-kd-primary hover:text-kd-primary-hover text-sm font-medium transition-colors"
                                            >
                                                ดูทั้งหมด
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="relative inline-block" ref={profileRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsProfileOpen(!isProfileOpen);
                                        setIsChatOpen(false);
                                    }}
                                    className="h-9 w-9 rounded-full bg-kd-card grid place-items-center hover:bg-kd-hover transition-colors text-sm font-semibold"
                                    title={user?.Username}
                                >
                                    {user?.Avatar_URL ? (
                                        <img src={`${API_BASE}${user.Avatar_URL}`} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        "👤"
                                    )}
                                </button>

                                {isProfileOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-kd-border flex flex-col z-50 py-2">
                                        {user && (
                                            <div className="px-5 py-2 text-sm text-kd-text-light border-b border-kd-border mb-1">
                                                {user.Username}
                                            </div>
                                        )}
                                        <Link href="/profile?tab=profile" onClick={() => setIsProfileOpen(false)} className="px-5 py-2.5 text-[15px] text-kd-text hover:bg-kd-hover hover:text-kd-primary transition-colors">
                                            ดูและแก้ไขข้อมูลส่วนตัว
                                        </Link>
                                        <Link href="/profile?tab=review" onClick={() => setIsProfileOpen(false)} className="px-5 py-2.5 text-[15px] text-kd-text hover:bg-kd-hover hover:text-kd-primary transition-colors">
                                            รีวิวของฉัน
                                        </Link>
                                        <Link href="/my-products" onClick={() => setIsProfileOpen(false)} className="px-5 py-2.5 text-[15px] text-kd-text hover:bg-kd-hover hover:text-kd-primary transition-colors">
                                            สินค้าของฉัน
                                        </Link>
                                        <Link href="/history" onClick={() => setIsProfileOpen(false)} className="px-5 py-2.5 text-[15px] text-kd-text hover:bg-kd-hover hover:text-kd-primary transition-colors">
                                            ประวัติการใช้งาน
                                        </Link>
                                        <Link href="/chat" onClick={() => setIsProfileOpen(false)} className="px-5 py-2.5 text-[15px] text-kd-text hover:bg-kd-hover hover:text-kd-primary transition-colors">
                                            แชท
                                        </Link>

                                        {user?.Role === "admin" && (
                                            <>
                                                <div className="border-t border-kd-border my-1" />
                                                <Link
                                                    href="/admin"
                                                    onClick={() => setIsProfileOpen(false)}
                                                    className="px-5 py-2.5 text-[15px] text-kd-primary font-semibold hover:bg-kd-hover transition-colors"
                                                >
                                                    ระบบจัดการ (Admin)
                                                </Link>
                                            </>
                                        )}

                                        <div className="border-t border-kd-border my-1" />

                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="text-left px-5 py-2.5 text-[15px] text-red-500 hover:bg-kd-hover transition-colors"
                                        >
                                            ออกจากระบบ
                                        </button>
                                    </div>
                                )}
                            </div>

                            <Link
                                href="/products/create"
                                className="px-4 py-2 rounded-lg bg-kd-primary text-white text-sm font-semibold hover:bg-kd-primary-hover transition-colors"
                            >
                                ลงขาย
                            </Link>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={onLoginClick ?? (() => router.push("/login"))}
                            className="px-4 py-2 rounded-lg bg-kd-primary text-white text-sm font-semibold hover:bg-kd-primary-hover transition-colors"
                        >
                            เข้าสู่ระบบ
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
