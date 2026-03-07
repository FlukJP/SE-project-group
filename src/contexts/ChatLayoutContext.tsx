"use client";

import { createContext, useContext } from "react";
import type { ChatRoomWithPartner } from "@/src/types/Chat";

interface ChatLayoutState {
  rooms: ChatRoomWithPartner[];
  refreshRooms: () => Promise<void>;
}

export const ChatLayoutContext = createContext<ChatLayoutState>({
  rooms: [],
  refreshRooms: async () => {},
});

export function useChatLayout(): ChatLayoutState {
  return useContext(ChatLayoutContext);
}
