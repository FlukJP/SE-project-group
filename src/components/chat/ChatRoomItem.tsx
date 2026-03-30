"use client";

import Link from "next/link";
import type { ChatRoomWithPartner } from "@/src/types/Chat";

interface Props {
    room: ChatRoomWithPartner;
    isActive: boolean;
}

// Renders a single chat room entry showing the partner name, last message, timestamp, and unread count
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
            className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
                isActive
                    ? "border border-[#DCD0C0] bg-white shadow-sm"
                    : "hover:bg-[#E6D5C3]"
            }`}
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D9734E] text-sm font-bold text-white">
                {room.PartnerName?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-[#4A3B32]">
                        {room.PartnerName}
                    </span>
                    <div className="ml-2 flex shrink-0 items-center gap-2">
                        <span className="text-[11px] text-[#A89F91]">
                            {timeStr}
                        </span>
                        {!!room.UnreadCount && room.UnreadCount > 0 && (
                            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                {room.UnreadCount > 99 ? "99+" : room.UnreadCount}
                            </span>
                        )}
                    </div>
                </div>
                {room.ProductTitle && (
                    <p className="mt-0.5 truncate text-[11px] text-[#A89F91]">
                        {room.ProductTitle}
                    </p>
                )}
                {room.LastMessage && (
                    <p className="mt-0.5 truncate text-xs text-[#6E6258]">
                        {room.LastMessage}
                    </p>
                )}
            </div>
        </Link>
    );
}
