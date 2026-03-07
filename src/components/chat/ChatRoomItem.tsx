"use client";

import Link from "next/link";
import type { ChatRoomWithPartner } from "@/src/types/Chat";

interface Props {
  room: ChatRoomWithPartner;
  isActive: boolean;
}

export default function ChatRoomItem({ room, isActive }: Props) {
  const displayTime = room.LastMessageTime || room.Created_At;
  const timeStr = displayTime
    ? new Date(displayTime).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
      })
    : "";

  return (
    <Link
      href={`/chat/${room.Chat_ID}`}
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
        isActive
          ? "bg-white border border-gray-200 shadow-sm"
          : "hover:bg-white/60"
      }`}
    >
      <div className="h-10 w-10 rounded-full bg-[#121E4D] text-white flex items-center justify-center font-bold text-sm shrink-0">
        {room.PartnerName?.charAt(0)?.toUpperCase() || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm text-gray-900 truncate">
            {room.PartnerName}
          </span>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="text-[11px] text-gray-400">
              {timeStr}
            </span>
            {!!room.UnreadCount && room.UnreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {room.UnreadCount > 99 ? "99+" : room.UnreadCount}
              </span>
            )}
          </div>
        </div>
        {room.LastMessage && (
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {room.LastMessage}
          </p>
        )}
      </div>
    </Link>
  );
}
