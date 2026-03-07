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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  const chatIdNum = Number(chatId);

  const currentRoom = rooms.find((r) => r.Chat_ID === chatIdNum);
  const partnerName = currentRoom?.PartnerName || "คู่สนทนา";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch messages + mark as read
  useEffect(() => {
    if (!chatId || !user) return;

    isInitialLoad.current = true;
    setIsLoading(true);
    setPage(1);
    setMessages([]); // Fix #7: reset old messages when switching rooms
    chatApi
      .getMessages(chatIdNum)
      .then((res) => {
        setMessages(res.data);
        setHasMore(res.pagination.hasMore);
        chatApi.markAsRead(chatIdNum).catch(() => {});
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [chatId, chatIdNum, user]);

  // Socket: join room, listen for newMessage
  useEffect(() => {
    if (!chatId) return;

    const roomId = String(chatId);

    // Only join when socket is connected
    if (socket.connected) {
      socket.emit("join", roomId);
    }

    const handleConnect = () => {
      socket.emit("join", roomId);
    };

    // Fix #6: Prevent duplicate messages by checking Messages_ID
    const handleNewMessage = (message: MessageWithSender) => {
      setMessages((prev) => {
        if (prev.some((m) => m.Messages_ID === message.Messages_ID)) {
          return prev;
        }
        return [...prev, message];
      });
      chatApi.markAsRead(chatIdNum).catch(() => {});
    };

    socket.on("connect", handleConnect);
    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.emit("leave", roomId);
      socket.off("connect", handleConnect);
      socket.off("newMessage", handleNewMessage);
    };
  }, [chatId, chatIdNum]);

  // Auto-scroll on initial load and new messages
  useEffect(() => {
    if (isInitialLoad.current && messages.length > 0) {
      scrollToBottom();
      isInitialLoad.current = false;
    }
  }, [messages, scrollToBottom]);

  // Auto-scroll when a new message is appended (not when loading older)
  useEffect(() => {
    if (!isInitialLoad.current && !isLoadingMore) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom, isLoadingMore]);

  // Load older messages
  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const container = messagesContainerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;

    try {
      const nextPage = page + 1;
      const res = await chatApi.getMessages(chatIdNum, nextPage);
      setMessages((prev) => [...res.data, ...prev]);
      setPage(nextPage);
      setHasMore(res.pagination.hasMore);

      // Restore scroll position so it doesn't jump
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      });
    } catch (err) {
      console.error("Failed to load more messages:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, chatIdNum]);

  // Detect scroll to top
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    if (container.scrollTop < 50 && hasMore && !isLoadingMore) {
      loadMoreMessages();
    }
  }, [hasMore, isLoadingMore, loadMoreMessages]);

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
        Timestamp: new Date().toISOString(),
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

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4"
      >
        {isLoadingMore && (
          <div className="text-center text-xs text-gray-400 py-2">
            กำลังโหลดข้อความเก่า...
          </div>
        )}
        {!hasMore && messages.length > 0 && (
          <div className="text-center text-xs text-gray-300 py-2">
            ไม่มีข้อความเก่ากว่านี้แล้ว
          </div>
        )}
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
