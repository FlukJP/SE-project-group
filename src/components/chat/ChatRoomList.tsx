"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import type { ChatRoomWithPartner } from "@/src/types/Chat";
import ChatRoomItem from "./ChatRoomItem";

interface Props {
    rooms: ChatRoomWithPartner[];
    activeTab: string;
}

// Filters and renders the list of chat rooms based on the active tab (all, buyer, or seller)
export default function ChatRoomList({ rooms, activeTab }: Props) {
    const pathname = usePathname();
    const { user } = useAuth();

    const activeChatId = pathname.match(/\/chat\/(\d+)/)?.[1];

    const filteredRooms = rooms.filter((room) => {
        if (activeTab === "all") return true;
        if (activeTab === "buyer") return user?.User_ID === room.Participant_2;
        if (activeTab === "seller") return user?.User_ID === room.Participant_1;
        return true;
    });

    if (filteredRooms.length === 0) {
        return (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-[#DCD0C0] bg-white/70 px-4 py-8 text-center">
                <div className="mb-3 text-3xl">💬</div>
                <div className="text-sm font-medium text-[#4A3B32]">ยังไม่มีแชทในหมวดนี้</div>
                <p className="mt-1 text-xs text-[#A89F91]">
                    เมื่อเริ่มคุยกับผู้ซื้อหรือผู้ขาย รายการแชทจะมาแสดงที่นี่
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            {filteredRooms.map((room) => (
                <ChatRoomItem
                    key={room.Chat_ID}
                    room={room}
                    isActive={String(room.Chat_ID) === activeChatId}
                />
            ))}
        </div>
    );
}
