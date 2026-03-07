"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { useChatLayout } from "@/src/contexts/ChatLayoutContext";
import { chatApi } from "@/src/lib/api";

function ChatPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { refreshRooms } = useChatLayout();
  const isCreatingRef = useRef(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const sellerId = searchParams.get("seller");
  const productId = searchParams.get("product");

  useEffect(() => {
    if (!sellerId || !productId || !user || isCreatingRef.current) return;

    if (Number(sellerId) === user.User_ID) {
      setError("ไม่สามารถแชทกับตัวเองได้");
      return;
    }

    isCreatingRef.current = true;
    setIsCreating(true);
    chatApi
      .findOrCreateRoom(Number(sellerId), Number(productId))
      .then(async (res) => {
        await refreshRooms();
        router.replace(`/chat/${res.data.Chat_ID}`);
      })
      .catch((err) => {
        console.error("Failed to create chat room:", err);
        setError("ไม่สามารถเปิดแชทได้");
        isCreatingRef.current = false;
        setIsCreating(false);
      });
  }, [sellerId, productId, user, refreshRooms, router]);

  if (isCreating) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-gray-500">กำลังเปิดแชท...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full w-full">
      <div className="w-32 h-32 mb-4 bg-gray-100 rounded-full flex items-center justify-center relative">
        <svg viewBox="0 0 24 24" fill="#121E4D" className="w-16 h-16">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      </div>
      <p className="text-gray-600 text-lg font-medium">เริ่มพูดคุย</p>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    }>
      <ChatPageInner />
    </Suspense>
  );
}
