import { Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { ChatService } from '../services/chat.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const ChatController = {
    /** Return all chat rooms in the authenticated user's inbox */
    getChatRooms: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);

            const chatRooms = await ChatService.getChatInboxForUser(req.user.userID);

            res.status(200).json({ success: true, data: chatRooms });
        } catch (error) {
            next(error);
        }
    },

    /** Return the details of a specific chat room, verifying the user is a participant */
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

    /** Return an existing chat room for the given seller and product, or create a new one */
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

    /** Soft-delete (hide) a chat room for the authenticated participant */
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

    /** Return paginated messages from a chat room for the authenticated user */
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

    /** Validate content length and persist a new message in the specified chat room */
    sendMessage: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);

            const chatId = Number(req.params.chatId);
            const { content, type } = req.body;
            if (!content?.trim()) throw new AppError("Message content is required", 400);
            if (content.trim().length > 5000) throw new AppError("Message content must not exceed 5000 characters", 400);

            const messageType = type === 'image' ? 'image' : 'text';
            const { messageId, autoReply } = await ChatService.sendMessage(chatId, req.user.userID, content.trim(), messageType);

            if (autoReply) {
                req.app?.get?.("io")?.to(String(chatId)).emit("newMessage", autoReply);
            }

            res.status(201).json({
                success: true,
                message: "Message sent successfully",
                messageId,
            });
        } catch (error) {
            next(error);
        }
    },

    /** Mark all unread messages in a chat room as read for the authenticated user */
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

    /** Return the total count of unread messages across all chat rooms for the authenticated user */
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
