"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { useChatLayout } from "@/src/contexts/ChatLayoutContext";
import { chatApi } from "@/src/lib/api";
import { socket } from "@/src/lib/socket";
import type { MessageWithSender } from "@/src/types/Messages";
import MessageBubble from "@/src/components/chat/MessageBubble";
import ChatInput from "@/src/components/chat/ChatInput";

export default function ChatConversationPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuth();
  const { rooms } = useChatLayout();

  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatIdNum = Number(chatId);

  const currentRoom = rooms.find((r) => r.Chat_ID === chatIdNum);
  const partnerName = currentRoom?.PartnerName || "คู่สนทนา";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch messages + mark as read
  useEffect(() => {
    if (!chatId || !user) return;

    setIsLoading(true);
    chatApi
      .getMessages(chatIdNum)
      .then((res) => {
        setMessages(res.data);
        chatApi.markAsRead(chatIdNum).catch(() => {});
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, user]);

  // Socket: join room, listen for newMessage
  useEffect(() => {
    if (!chatId) return;

    const roomId = String(chatId);
    socket.emit("join", roomId);

    const handleNewMessage = (message: MessageWithSender) => {
      setMessages((prev) => [...prev, message]);
      chatApi.markAsRead(chatIdNum).catch(() => {});
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.emit("leave", roomId);
      socket.off("newMessage", handleNewMessage);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Send message
  const handleSend = async (content: string) => {
    if (!user?.User_ID || isSending) return;

    setIsSending(true);
    try {
      const res = await chatApi.sendMessage(chatIdNum, content);

      const newMsg: MessageWithSender = {
        Messages_ID: res.messageId,
        Chat_ID: chatIdNum,
        Sender_ID: user.User_ID,
        Content: content,
        MessagesType: "text",
        Is_Read: 0,
        Timestamp: new Date(),
        SenderName: user.Username,
      };

      setMessages((prev) => [...prev, newMsg]);

      socket.emit("sendMessage", {
        roomId: String(chatId),
        message: newMsg,
      });
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500 text-sm">กำลังโหลดข้อความ...</p>
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="h-8 w-8 rounded-full bg-[#121E4D] text-white flex items-center justify-center font-bold text-xs shrink-0">
          {partnerName.charAt(0).toUpperCase()}
        </div>
        <span className="font-medium text-sm text-gray-900">{partnerName}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-gray-400 py-8">
            เริ่มต้นการสนทนา
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.Messages_ID}
              message={msg}
              isMine={msg.Sender_ID === user?.User_ID}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={handleSend} disabled={isSending} />
    </>
  );
}
