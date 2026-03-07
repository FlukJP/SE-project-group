"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import type { ChatRoomWithPartner } from "@/src/types/Chat";
import ChatRoomItem from "./ChatRoomItem";

interface Props {
  rooms: ChatRoomWithPartner[];
  activeTab: string;
}

export default function ChatRoomList({ rooms, activeTab }: Props) {
  const pathname = usePathname();
  const { user } = useAuth();

  const activeChatId = pathname.match(/\/chat\/(\d+)/)?.[1];

  const filteredRooms = rooms.filter((room) => {
    if (activeTab === "all") return true;
    if (activeTab === "buyer") {
      return user?.User_ID === room.Participant_2;
    }
    if (activeTab === "seller") {
      return user?.User_ID === room.Participant_1;
    }
    return true;
  });

  if (filteredRooms.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400 py-8">
        ไม่มีแชท
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
