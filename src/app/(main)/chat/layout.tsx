"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import Navbar from "@/src/components/layout/Navbar";
import ChatRoomList from "@/src/components/chat/ChatRoomList";
import { TabButtonGroup } from "@/src/components/ui";
import { ChatLayoutContext } from "@/src/contexts/ChatLayoutContext";
import { chatApi } from "@/src/lib/api";
import { useError } from "@/src/contexts/ErrorContext";
import { socket } from "@/src/lib/socket";
import type { ChatRoomWithPartner } from "@/src/types/Chat";

type ChatTab = "all" | "buyer" | "seller";

const CHAT_TABS: { key: ChatTab; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "buyer", label: "แชทกับผู้ซื้อ" },
  { key: "seller", label: "แชทกับผู้ขาย" },
];

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const { showError } = useError();
  const [activeTab, setActiveTab] = useState<ChatTab>("all");
  const [rooms, setRooms] = useState<ChatRoomWithPartner[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  const refreshRooms = useCallback(async () => {
    try {
      const res = await chatApi.getRooms();
      setRooms(res.data);
      setRoomsError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "โหลดห้องแชทไม่สำเร็จ";
      showError(message);
      setRoomsError(message);
    } finally {
      setIsLoadingRooms(false);
    }
  }, [showError]);

  useEffect(() => {
    if (!isLoggedIn) return;

    refreshRooms();

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("newMessage");
    };
  }, [isLoggedIn, refreshRooms]);

  return (
    <ChatLayoutContext.Provider value={{ rooms, refreshRooms }}>
      <Navbar />
      <div className="mx-auto my-6 flex h-[calc(100vh-80px)] max-w-7xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex min-w-[280px] w-[320px] flex-col border-r border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-[#FCFAF6] px-4 py-4">
            <h1 className="text-lg font-bold text-[#4A3B32]">ข้อความ</h1>
            <p className="mt-1 text-xs text-[#A89F91]">ติดตามบทสนทนากับผู้ซื้อและผู้ขายได้จากที่นี่</p>
          </div>

          <TabButtonGroup items={CHAT_TABS} value={activeTab} onChange={setActiveTab} variant="underline" />

          <div className="border-b border-gray-200 bg-[#FFF8CC] p-3 text-[11px] text-gray-700">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#121E4D] font-bold text-white">
                !
              </div>
              <p>
                เว็บไซต์ไม่มีบริการเป็นตัวกลางรับชำระเงิน การซื้อขายเป็นการตกลงกันเองระหว่างผู้ขายและผู้ซื้อ
                โปรดระวังการให้ข้อมูลส่วนตัวเพื่อความปลอดภัยของคุณ
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#F4F5F5] p-3">
            {isLoadingRooms ? (
              <div className="flex min-h-[220px] items-center justify-center text-sm text-gray-400">
                กำลังโหลดรายการแชท...
              </div>
            ) : roomsError ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-red-100 bg-red-50 px-4 text-center text-sm text-red-500">
                {roomsError}
              </div>
            ) : (
              <ChatRoomList rooms={rooms} activeTab={activeTab} />
            )}
          </div>

          <div className="border-t border-gray-200 bg-white p-3">
            <div className="rounded-xl bg-[#F9F6F0] px-3 py-2 text-xs text-[#A89F91]">
              เคล็ดลับ: ตอบกลับไวและให้ข้อมูลครบถ้วน จะช่วยให้ปิดการขายได้ง่ายขึ้น
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-[#FAFAFA]">{children}</div>
      </div>
    </ChatLayoutContext.Provider>
  );
}
