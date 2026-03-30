"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { chatApi, resolveMediaUrl } from "@/src/lib/api";
import type { ChatRoomWithPartner } from "@/src/types/Chat";

function formatChatDate(value?: Date | string) {
    if (!value) return "";

    return new Date(value).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
    });
}

// Renders the sticky top navigation bar with chat popover, profile dropdown, and login/logout actions
export default function Navbar({ onLoginClick }: { onLoginClick?: () => void }) {
    const router = useRouter();
    const { isLoggedIn, user, logout } = useAuth();
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [chatRooms, setChatRooms] = useState<ChatRoomWithPartner[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const [chatError, setChatError] = useState("");
    const popoverRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    const isVerified = !!user?.Is_Email_Verified && !!user?.Is_Phone_Verified;
    const previewRooms = chatRooms.slice(0, 5);

    useEffect(() => {
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

    useEffect(() => {
        let cancelled = false;

        async function loadChatPreview() {
            if (!isLoggedIn || !isVerified) {
                setChatRooms([]);
                setUnreadCount(0);
                setChatError("");
                setIsLoadingChats(false);
                return;
            }

            setIsLoadingChats(true);
            setChatError("");

            try {
                const [roomsRes, unreadRes] = await Promise.all([
                    chatApi.getRooms(),
                    chatApi.getUnreadCount(),
                ]);

                if (cancelled) return;

                setChatRooms(roomsRes.data);
                setUnreadCount(unreadRes.unreadCount || 0);
            } catch (err) {
                if (cancelled) return;

                setChatRooms([]);
                setUnreadCount(0);
                setChatError(err instanceof Error ? err.message : "โหลดแชทไม่สำเร็จ");
            } finally {
                if (!cancelled) {
                    setIsLoadingChats(false);
                }
            }
        }

        loadChatPreview();

        return () => {
            cancelled = true;
        };
    }, [isLoggedIn, isVerified]);

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
        <header className="sticky top-0 z-30 border-b border-[#E6D5C3] bg-[#F9F6F0] shadow-sm backdrop-blur">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#D9734E] font-extrabold text-white">
                        K
                    </div>
                    <div className="font-extrabold text-[#4A3B32]">KMUTNB2Market</div>
                    <div className="-mt-0.5 text-[11px] text-[#A89F91]">ตลาดมือสองใกล้คุณ</div>
                </Link>

                <div className="flex items-center gap-3">
                    {isLoggedIn ? (
                        <>
                            <div className="relative inline-block" ref={popoverRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsChatOpen((open) => !open);
                                        setIsProfileOpen(false);
                                    }}
                                    className="relative flex items-center justify-center rounded-full p-2 text-xl transition-colors hover:bg-[#E6D5C3]/50"
                                    aria-label="เปิดรายการแชท"
                                >
                                    💬
                                    {isVerified && unreadCount > 0 && (
                                        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#D9734E] px-1 text-[10px] font-bold text-white">
                                            {unreadCount > 99 ? "99+" : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {isChatOpen && (
                                    <div className="absolute right-0 top-full z-50 mt-2 flex h-[400px] w-[350px] cursor-default flex-col overflow-hidden rounded-lg border border-[#E6D5C3] bg-white shadow-2xl">
                                        <div className="border-b border-[#E6D5C3] px-4 py-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <div className="text-sm font-semibold text-[#4A3B32]">แชท</div>
                                                    <div className="text-xs text-[#A89F91]">
                                                        {isVerified
                                                            ? unreadCount > 0
                                                                ? `มี ${unreadCount} ข้อความใหม่`
                                                                : "ไม่มีข้อความใหม่"
                                                            : "ยืนยันตัวตนก่อนเพื่อใช้งานแชท"}
                                                    </div>
                                                </div>
                                                {isVerified && unreadCount > 0 && (
                                                    <div className="rounded-full bg-[#FDE7DF] px-2 py-1 text-[11px] font-semibold text-[#D9734E]">
                                                        {unreadCount > 99 ? "99+" : unreadCount} ใหม่
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto bg-white">
                                            {!isVerified ? (
                                                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                                                    <div className="mb-3 text-4xl">💬</div>
                                                    <p className="text-sm font-medium text-[#4A3B32]">ยืนยันอีเมลและเบอร์โทรก่อน</p>
                                                    <p className="mt-1 text-xs text-[#A89F91]">แล้วคุณจะเริ่มแชทกับผู้ซื้อหรือผู้ขายได้</p>
                                                </div>
                                            ) : isLoadingChats ? (
                                                <div className="flex h-full items-center justify-center p-6 text-sm text-[#A89F91]">
                                                    กำลังโหลดแชท...
                                                </div>
                                            ) : chatError ? (
                                                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                                                    <p className="text-sm font-medium text-[#4A3B32]">โหลดแชทไม่สำเร็จ</p>
                                                    <p className="mt-1 text-xs text-[#C45A5A]">{chatError}</p>
                                                </div>
                                            ) : previewRooms.length === 0 ? (
                                                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                                                    <div className="mb-3 text-4xl">💬</div>
                                                    <p className="text-sm font-medium text-[#4A3B32]">ยังไม่มีบทสนทนา</p>
                                                    <p className="mt-1 text-xs text-[#A89F91]">เมื่อเริ่มคุยกับผู้ซื้อหรือผู้ขาย ห้องแชทจะมาแสดงที่นี่</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-[#F1E8DC]">
                                                    {previewRooms.map((room) => (
                                                        <Link
                                                            key={room.Chat_ID}
                                                            href={`/chat/${room.Chat_ID}`}
                                                            onClick={() => setIsChatOpen(false)}
                                                            className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[#F9F6F0]"
                                                        >
                                                            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D9734E] text-sm font-bold text-white">
                                                                {room.PartnerName?.charAt(0)?.toUpperCase() || "?"}
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="min-w-0">
                                                                        <div className="truncate text-sm font-semibold text-[#4A3B32]">
                                                                            {room.PartnerName}
                                                                        </div>
                                                                        {room.ProductTitle && (
                                                                            <div className="truncate text-[11px] text-[#A89F91]">
                                                                                {room.ProductTitle}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex shrink-0 items-center gap-2">
                                                                        <span className="text-[11px] text-[#A89F91]">
                                                                            {formatChatDate(room.LastMessageTime || room.Created_At)}
                                                                        </span>
                                                                        {!!room.UnreadCount && room.UnreadCount > 0 && (
                                                                            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#D9734E] px-1 text-[10px] font-bold text-white">
                                                                                {room.UnreadCount > 99 ? "99+" : room.UnreadCount}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <p className="mt-1 truncate text-xs text-[#6E6258]">
                                                                    {room.LastMessage || "ยังไม่มีข้อความล่าสุด"}
                                                                </p>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-[#E6D5C3] bg-white p-4 text-center">
                                            <Link
                                                href={isVerified ? "/chat" : "/profile?tab=profile"}
                                                onClick={() => setIsChatOpen(false)}
                                                className="text-sm font-medium text-[#D9734E] transition-colors hover:text-[#C25B38]"
                                            >
                                                {isVerified ? "ดูทั้งหมด" : "ไปยืนยันตัวตน"}
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="relative inline-block" ref={profileRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsProfileOpen((open) => !open);
                                        setIsChatOpen(false);
                                    }}
                                    className="grid h-9 w-9 place-items-center rounded-full bg-[#E6D5C3] text-sm font-semibold transition-colors hover:bg-[#DCD0C0]"
                                    title={user?.Username}
                                >
                                    {user?.Avatar_URL ? (
                                        <img
                                            src={resolveMediaUrl(user.Avatar_URL)}
                                            alt=""
                                            className="h-full w-full rounded-full object-cover"
                                        />
                                    ) : (
                                        "👤"
                                    )}
                                </button>

                                {isProfileOpen && (
                                    <div className="absolute right-0 top-full z-50 mt-2 flex w-56 flex-col rounded-lg border border-[#E6D5C3] bg-white py-2 shadow-xl">
                                        {user && (
                                            <div className="mb-1 border-b border-[#E6D5C3] px-5 py-2 text-sm text-[#A89F91]">
                                                {user.Username}
                                            </div>
                                        )}
                                        <Link href="/profile?tab=profile" onClick={() => setIsProfileOpen(false)} className="px-5 py-2.5 text-[15px] text-[#4A3B32] transition-colors hover:bg-[#E6D5C3] hover:text-[#D9734E]">
                                            ดูและแก้ไขข้อมูลส่วนตัว
                                        </Link>
                                        <Link href="/profile?tab=review" onClick={() => setIsProfileOpen(false)} className="px-5 py-2.5 text-[15px] text-[#4A3B32] transition-colors hover:bg-[#E6D5C3] hover:text-[#D9734E]">
                                            รีวิวของฉัน
                                        </Link>
                                        <Link href="/my-products" onClick={() => setIsProfileOpen(false)} className="px-5 py-2.5 text-[15px] text-[#4A3B32] transition-colors hover:bg-[#E6D5C3] hover:text-[#D9734E]">
                                            สินค้าของฉัน
                                        </Link>
                                        <Link href="/history" onClick={() => setIsProfileOpen(false)} className="px-5 py-2.5 text-[15px] text-[#4A3B32] transition-colors hover:bg-[#E6D5C3] hover:text-[#D9734E]">
                                            ประวัติการใช้งาน
                                        </Link>
                                        <Link href="/chat" onClick={() => setIsProfileOpen(false)} className="px-5 py-2.5 text-[15px] text-[#4A3B32] transition-colors hover:bg-[#E6D5C3] hover:text-[#D9734E]">
                                            แชท
                                        </Link>

                                        {user?.Role === "admin" && (
                                            <>
                                                <div className="my-1 border-t border-[#E6D5C3]" />
                                                <Link
                                                    href="/admin"
                                                    onClick={() => setIsProfileOpen(false)}
                                                    className="px-5 py-2.5 text-[15px] font-semibold text-[#D9734E] transition-colors hover:bg-[#E6D5C3]"
                                                >
                                                    ระบบจัดการ (Admin)
                                                </Link>
                                            </>
                                        )}

                                        <div className="my-1 border-t border-[#E6D5C3]" />

                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="px-5 py-2.5 text-left text-[15px] text-[#C45A5A] transition-colors hover:bg-[#E6D5C3]"
                                        >
                                            ออกจากระบบ
                                        </button>
                                    </div>
                                )}
                            </div>

                            <Link
                                href={isVerified ? "/products/create" : "/profile?tab=profile"}
                                className="rounded-lg bg-[#D9734E] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#C25B38]"
                            >
                                {isVerified ? "ลงขาย" : "ยืนยันตัวตน"}
                            </Link>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={onLoginClick ?? (() => router.push("/login"))}
                            className="rounded-lg bg-[#D9734E] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#C25B38]"
                        >
                            เข้าสู่ระบบ
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
