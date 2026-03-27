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
  { key: "all", label: "à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”" },
  { key: "buyer", label: "à¹à¸Šà¸—à¸à¸±à¸šà¸œà¸¹à¹‰à¸‹à¸·à¹‰à¸­" },
  { key: "seller", label: "à¹à¸Šà¸—à¸à¸±à¸šà¸œà¸¹à¹‰à¸‚à¸²à¸¢" },
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
      const message = err instanceof Error ? err.message : "à¹‚à¸«à¸¥à¸”à¸«à¹‰à¸­à¸‡à¹à¸Šà¸—à¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ";
      showError(message);
      setRoomsError(message);
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

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
              à¹€à¸§à¹‡à¸šà¹„à¸‹à¸•à¹Œà¹„à¸¡à¹ˆà¸¡à¸µà¸šà¸£à¸´à¸à¸²à¸£à¹€à¸›à¹‡à¸™à¸•à¸±à¸§à¸à¸¥à¸²à¸‡à¸£à¸±à¸šà¸Šà¸³à¸£à¸°à¹€à¸‡à¸´à¸™à¹ƒà¸™à¸à¸²à¸£à¸‹à¸·à¹‰à¸­à¸‚à¸²à¸¢ à¹‚à¸”à¸¢à¸à¸²à¸£à¸‹à¸·à¹‰à¸­à¸‚à¸²à¸¢à¸ªà¸´à¸™à¸„à¹‰à¸²à¸ˆà¸°à¹€à¸›à¹‡à¸™à¸à¸²à¸£à¸•à¸à¸¥à¸‡à¸à¸±à¸™à¹€à¸­à¸‡à¸£à¸°à¸«à¸§à¹ˆà¸²à¸‡à¸œà¸¹à¹‰à¸‚à¸²à¸¢à¹à¸¥à¸°à¸œà¸¹à¹‰à¸‹à¸·à¹‰à¸­ à¹‚à¸›à¸£à¸”à¸£à¸°à¸§à¸±à¸‡à¸à¸²à¸£à¹ƒà¸«à¹‰à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸ªà¹ˆà¸§à¸™à¸•à¸±à¸§à¹€à¸žà¸·à¹ˆà¸­à¸„à¸§à¸²à¸¡à¸›à¸¥à¸­à¸”à¸ à¸±à¸¢à¸‚à¸­à¸‡à¸„à¸¸à¸“
            </p>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#F4F5F5] p-2">
            {isLoadingRooms ? (
              <div className="flex items-center justify-center py-8 text-sm text-gray-400">
                à¸à¸³à¸¥à¸±à¸‡à¹‚à¸«à¸¥à¸”...
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
              à¹à¸à¹‰à¹„à¸‚ (à¹€à¸£à¹‡à¸§à¹† à¸™à¸µà¹‰)
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
