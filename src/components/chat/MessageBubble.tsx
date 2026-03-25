"use client";

import Image from "next/image";
import type { MessageWithSender } from "@/src/types/Messages";

interface Props {
    message: MessageWithSender;
    isMine: boolean;
}

// Renders a single chat message bubble, aligned right for the current user and left for others
export default function MessageBubble({ message, isMine }: Props) {
    const time = message.Timestamp
        ? new Date(message.Timestamp).toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
        })
        : "";

    return (
        <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-3`}>
            <div
                className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                    isMine
                        ? "bg-[#D9734E] text-white rounded-br-md"
                        : "bg-[#E6D5C3] border border-[#DCD0C0] text-[#4A3B32] rounded-bl-md"
                }`}
            >
                {!isMine && (
                    <div className="text-xs font-medium text-[#D9734E] mb-1">
                        {message.SenderName}
                    </div>
                )}
                {message.MessagesType === "image" ? (
                    <Image
                        src={message.Content}
                        alt="sent image"
                        width={300}
                        height={200}
                        className="rounded-lg max-w-full h-auto cursor-pointer"
                        onClick={() => window.open(message.Content, "_blank")}
                    />
                ) : (
                    <p className="text-sm whitespace-pre-wrap break-all">
                        {message.Content}
                    </p>
                )}
                <div
                    className={`text-[10px] mt-1 text-right ${
                        isMine ? "text-white/60" : "text-[#A89F91]"
                    }`}
                >
                    {time}
                </div>
            </div>
        </div>
    );
}
