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

// Returns the current chat layout context containing the room list and refresh function.
export function useChatLayout(): ChatLayoutState {
    return useContext(ChatLayoutContext);
}
