import { Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { ChatService } from '../services/chat.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const ChatController = {
    // 1.View all of your chat history (Inbox)
    getChatRooms: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);

            const chatRooms = await ChatService.getChatInboxForUser(req.user.userID);

            res.status(200).json({ success: true, data: chatRooms });
        } catch (error) {
            next(error);
        }
    },

    // 2.View Chat Room by ID
    getChatRoomByID: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);

            const chatId = Number(req.params.chatId);
            const chatRoom = await ChatService.getChatRoomByID(chatId, req.user.userID);

            res.status(200).json({ success: true, data: chatRoom });
        } catch (error) {
            next(error);
        }
    },

    // 3.Find or Create Chat Room
    findOrCreateChatRoom: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);

            const { sellerId, productId } = req.body;
            if (!sellerId || !productId) throw new AppError("sellerId and productId are required", 400);

            const chatRoom = await ChatService.findOrCreateChatRoom(
                req.user.userID,
                Number(sellerId),
                Number(productId),
            );

            res.status(200).json({ success: true, data: chatRoom });
        } catch (error) {
            next(error);
        }
    },

    // 4.Delete Chat Room - Soft Delete (Hide)
    deleteChatRoom: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);

            const chatId = Number(req.params.chatId);
            await ChatService.deleteChatRoom(chatId, req.user.userID);

            res.status(200).json({ success: true, message: "Chat room deleted successfully" });
        } catch (error) {
            next(error);
        }
    },

    // 5.View Messages in Chat Room (Get Messages - paginated)
    getMessages: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);

            const chatId = Number(req.params.chatId);
            const page = req.query.page ? Number(req.query.page) : 1;
            const result = await ChatService.getMessagesByChatID(chatId, req.user.userID, page);

            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    },

    // 6.Send Message
    sendMessage: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);

            const chatId = Number(req.params.chatId);
            const { content, type } = req.body;
            if (!content?.trim()) throw new AppError("Message content is required", 400);
            if (content.trim().length > 5000) throw new AppError("Message content must not exceed 5000 characters", 400);

            const messageType = type === 'image' ? 'image' : 'text';
            const messageId = await ChatService.sendMessage(chatId, req.user.userID, content.trim(), messageType);

            res.status(201).json({
                success: true,
                message: "Message sent successfully",
                messageId,
            });
        } catch (error) {
            next(error);
        }
    },

    // 7.Mark Messages as Read
    markAsRead: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);

            const chatId = Number(req.params.chatId);
            await ChatService.markMessagesAsRead(chatId, req.user.userID);

            res.status(200).json({ success: true, message: "Messages marked as read" });
        } catch (error) {
            next(error);
        }
    },

    // 8.Get Unread Messages Count
    getUnreadCount: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);
            const count = await ChatService.getUnreadMessagesCountForUser(req.user.userID);
            res.status(200).json({ success: true, unreadCount: count });
        } catch (error) {
            next(error);
        }
    },
};
