import { ChatModel } from "@/src/models/chatModel";
import { Chat } from "@/src/types/Chat";
import { Message } from "@/src/types/Messages";
import { MessageModel } from "@/src/models/messageModel";
import { AppError } from "@/src/errors/AppError";

export const ChatService = {
    // Chat room
    // 1.Get chat room by user ID
    getChatRoomByUserID: async (userID: number): Promise<Chat[]> => {
        if (!userID) throw new AppError("User ID is required", 400);
        const chatRooms = await ChatModel.findByUserID(userID);
        return chatRooms || [];
    },

    // 2.Get chat room by ID
    getChatRoomByID: async (chatID: number, userID: number): Promise<Chat | null> => {
        if (!chatID || !userID) throw new AppError("Chat ID and User ID are required", 400);

        const chatRoom = await ChatModel.findByID(chatID);
        if (!chatRoom) throw new AppError("Chat room not found", 404);
        if (userID !== chatRoom.Participant_1 && userID !== chatRoom.Participant_2) throw new AppError("Unauthorized to access this chat room", 403);
        return chatRoom || null;
    },

    // 3.Find or create chat room
    findOrCreateChatRoom: async (buyerID: number, sellerID: number, productID: number): Promise<Chat> => {
        if (!buyerID || !sellerID || !productID) throw new AppError("Buyer ID, Seller ID and Product ID are required", 400);
        if (buyerID === sellerID) throw new AppError("Cannot create chat room with yourself", 400);

        const existingChat = await ChatModel.findExistingChat(buyerID, sellerID, productID);
        if (existingChat) return existingChat;

        const newChatData: Chat = {
            Participant_1: buyerID,
            Participant_2: sellerID,
            Chats_product_ID: productID,
        };

        const newChatID = await ChatModel.createChatRoom(newChatData);
        const newChat = await ChatModel.findByID(newChatID);
        if (!newChat) throw new AppError("Failed to create chat room", 500);
        return newChat;
    },

    // 4.Delete chat (Soft Delete)
    deleteChatRoom: async (chatID: number, userID: number): Promise<boolean> => {
        if (!chatID || !userID) throw new AppError("Chat ID and User ID are required", 400);

        const chatRoom = await ChatModel.findByID(chatID);
        if (!chatRoom) throw new AppError("Chat room not found", 404);
        if (userID === chatRoom.Participant_1) return await ChatModel.hideChatForParticipant(chatID, 'P1'); 
        else if (userID === chatRoom.Participant_2) return await ChatModel.hideChatForParticipant(chatID, 'P2');
        else throw new AppError("Unauthorized to delete this chat room", 403);
    },

    // Message
    // 1.Get messages by chat room ID
    getMessagesByChatID: async (chatID: number, userID: number, page:number) => {
        if (!chatID || !userID) throw new AppError("Chat ID and User ID are required", 400);

        const chatRoom = await ChatModel.findByID(chatID);
        if (!chatRoom) throw new AppError("Chat room not found", 404);
        if (userID !== chatRoom.Participant_1 && userID !== chatRoom.Participant_2) throw new AppError("Unauthorized to access messages in this chat room", 403);

        const limit = 50;
        const offset = (page - 1) * limit;
        const messages = await MessageModel.findByChatID(chatID, limit + 1, offset);
        const hasMore = messages.length > limit;

        if (hasMore) messages.pop();
        return {
            data: messages,
            pagination: { page, limit, hasMore }
        };
    },

    // 2.Get chat inbox for user
    getChatInboxForUser: async (userID: number) => {
        if (!userID) throw new AppError("User ID is required", 400);
        const chatRooms = await ChatModel.findByUserID(userID);
        return chatRooms || [];
    },

    // 3.Get unread messages count for user
    getUnreadMessagesCountForUser: async (userID: number) => {
        if (!userID) throw new AppError("User ID is required", 400);
        const unreadCount = await MessageModel.countUnreadByUserID(userID);
        return unreadCount;
    },

    // 4.Send message
    sendMessage: async (chatID: number, senderID: number, content: string, type: 'text' | 'image') => {
        if (!chatID || !senderID || !content) throw new AppError("Chat ID, Sender ID and content are required", 400);

        const chatRoom = await ChatModel.findByID(chatID);
        if (!chatRoom) throw new AppError("Chat room not found", 404);
        if (senderID !== chatRoom.Participant_1 && senderID !== chatRoom.Participant_2) throw new AppError("Unauthorized to send message in this chat room", 403);
        const newMessage: Message = {
            Chat_ID: chatID,
            Sender_ID: senderID,
            Content: content,
            MessagesType: type,
        };
        const createdMessage = await MessageModel.createMessageTransaction(newMessage);
        return createdMessage;
    },

    // 5.Mark messages as read
    markMessagesAsRead: async (chatID: number, userID: number) => {
        if (!chatID || !userID) throw new AppError("Chat ID and User ID are required", 400);

        const chatRoom = await ChatModel.findByID(chatID);
        if (!chatRoom) throw new AppError("Chat room not found", 404);
        if (userID !== chatRoom.Participant_1 && userID !== chatRoom.Participant_2) throw new AppError("Unauthorized to mark messages in this chat room", 403);
        await MessageModel.updateReadStatus(chatID, userID);
        return true;
    }
};