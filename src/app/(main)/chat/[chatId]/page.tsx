"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { useChatLayout } from "@/src/contexts/ChatLayoutContext";
import { chatApi } from "@/src/lib/api";
import { useError } from "@/src/contexts/ErrorContext";
import { socket } from "@/src/lib/socket";
import type { MessageWithSender } from "@/src/types/Messages";
import MessageBubble from "@/src/components/chat/MessageBubble";
import ChatInput from "@/src/components/chat/ChatInput";

export default function ChatConversationPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuth();
  const { rooms } = useChatLayout();
  const { showError } = useError();

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
  const currentRoom = rooms.find((room) => room.Chat_ID === chatIdNum);
  const partnerName = currentRoom?.PartnerName || "คู่สนทนา";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!chatId || !user) return;

    isInitialLoad.current = true;
    setIsLoading(true);
    setPage(1);
    setMessages([]);

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

  useEffect(() => {
    if (!chatId) return;

    const roomId = String(chatId);

    if (socket.connected) {
      socket.emit("join", roomId);
    }

    const handleConnect = () => {
      socket.emit("join", roomId);
    };

    const handleNewMessage = (message: MessageWithSender) => {
      setMessages((prev) => {
        if (prev.some((item) => item.Messages_ID === message.Messages_ID)) {
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

  useEffect(() => {
    if (isInitialLoad.current && messages.length > 0) {
      scrollToBottom();
      isInitialLoad.current = false;
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!isInitialLoad.current && !isLoadingMore) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom, isLoadingMore]);

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

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    if (container.scrollTop < 50 && hasMore && !isLoadingMore) {
      loadMoreMessages();
    }
  }, [hasMore, isLoadingMore, loadMoreMessages]);

  const handleSend = async (content: string) => {
    if (!user?.User_ID || isSending) return;

    setIsSending(true);
    try {
      const res = await chatApi.sendMessage(chatIdNum, content);

      const newMessage: MessageWithSender = {
        Messages_ID: res.messageId,
        Chat_ID: chatIdNum,
        Sender_ID: user.User_ID,
        Content: content,
        MessagesType: "text",
        Is_Read: 0,
        Timestamp: new Date().toISOString(),
        SenderName: user.Username,
      };

      setMessages((prev) => [...prev, newMessage]);

      socket.emit("sendMessage", {
        roomId: String(chatId),
        message: newMessage,
      });
    } catch (err) {
      showError(err instanceof Error ? err.message : "ส่งข้อความไม่สำเร็จ");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-gray-500">กำลังโหลดข้อความ...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#121E4D] text-xs font-bold text-white">
          {partnerName.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-gray-900">{partnerName}</span>
      </div>

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4"
      >
        {isLoadingMore && <div className="py-2 text-center text-xs text-gray-400">กำลังโหลดข้อความเก่า...</div>}
        {!hasMore && messages.length > 0 && (
          <div className="py-2 text-center text-xs text-gray-300">ไม่มีข้อความเก่ากว่านี้แล้ว</div>
        )}

        {messages.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">เริ่มต้นการสนทนา</div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.Messages_ID} message={message} isMine={message.Sender_ID === user?.User_ID} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={handleSend} disabled={isSending} />
    </>
  );
}
