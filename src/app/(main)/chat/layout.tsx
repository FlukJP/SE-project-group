"use client";

import { useState, useEffect, useCallback } from "react";
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
  }, []); // แนะนำให้เพิ่ม showError เข้าไปใน array นี้ถ้า lint เตือนนะครับ

  useEffect(() => {
    if (!isLoggedIn) return;

    refreshRooms();

    if (!socket.connected) {
      socket.connect();
    }

    // Fix #20: Only disconnect socket listeners, don't fully disconnect
    // Socket lifecycle should persist across page navigations while logged in
    return () => {
      socket.off("newMessage");
    };
  }, [isLoggedIn, refreshRooms]);

  return (
    <ChatLayoutContext.Provider value={{ rooms, refreshRooms }}>
      <Navbar />
      <div className="flex h-[calc(100vh-80px)] max-w-7xl mx-auto my-6 border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">

        <div className="w-1/4 min-w-[260px] border-r border-gray-200 flex flex-col bg-white">

          <TabButtonGroup
            items={CHAT_TABS}
            value={activeTab}
            onChange={setActiveTab}
            variant="underline"
          />


          <div className="bg-[#FFF8CC] p-3 text-[11px] text-gray-700 flex items-start gap-2 border-b border-gray-200">
            <div className="bg-[#121E4D] text-white rounded-full w-4 h-4 flex items-center justify-center font-bold shrink-0 mt-0.5">
              !
            </div>
            <p>
              เว็บไซต์ไม่มีบริการเป็นตัวกลางรับชำระเงินในการซื้อขาย โดยการซื้อขายสินค้าจะเป็นการตกลงกันเองระหว่างผู้ขายและผู้ซื้อ โปรดระวังการให้ข้อมูลส่วนตัวเพื่อความปลอดภัยของคุณ
            </p>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#F4F5F5] p-2">
            {isLoadingRooms ? (
              <div className="flex items-center justify-center py-8 text-sm text-gray-400">
                กำลังโหลด...
              </div>
            ) : roomsError ? (
              <div className="flex items-center justify-center py-8 px-4 text-sm text-red-500 text-center">
                {roomsError}
              </div>
            ) : (
              <ChatRoomList rooms={rooms} activeTab={activeTab} />
            )}
          </div>

          <div className="p-3 border-t border-gray-200 bg-white">
            <button disabled className="px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-400 cursor-not-allowed opacity-50">
              แก้ไข (เร็วๆ นี้)
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-[#FAFAFA] flex flex-col">
          {children}
        </div>

      </div>
    </ChatLayoutContext.Provider>
  );
}