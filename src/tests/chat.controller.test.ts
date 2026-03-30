import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatController } from '@/src/controllers/chat.controller';
import { ChatService } from '@/src/services/chat.service';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '@/src/middleware/auth.middleware';

vi.mock('@/src/services/chat.service');

function mockReq(overrides: Partial<AuthRequest> = {}): AuthRequest {
    return {
        user: { userID: 10, role: 'customer' },
        params: {},
        query: {},
        body: {},
        app: { get: vi.fn() },
        ...overrides,
    } as unknown as AuthRequest;
}

function mockRes(): Response {
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    };
    return res as unknown as Response;
}

describe('ChatController', () => {
    let next: NextFunction;

    beforeEach(() => {
        vi.restoreAllMocks();
        next = vi.fn();
    });

    // ===== getChatRooms =====
    describe('getChatRooms', () => {
        it('should return 200 with chat rooms', async () => {
            const rooms = [{ Chat_ID: 1, PartnerName: 'Alice' }];
            vi.mocked(ChatService.getChatInboxForUser).mockResolvedValue(rooms as never);

            const req = mockReq();
            const res = mockRes();

            await ChatController.getChatRooms(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: rooms });
        });

        it('should call next with error when user is missing', async () => {
            const req = mockReq({ user: undefined });
            const res = mockRes();

            await ChatController.getChatRooms(req, res, next);

            expect(next).toHaveBeenCalled();
            const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
            expect(error.message).toBe('Unauthorized');
        });
    });

    // ===== getChatRoomByID =====
    describe('getChatRoomByID', () => {
        it('should return 200 with chat room', async () => {
            const room = { Chat_ID: 1 };
            vi.mocked(ChatService.getChatRoomByID).mockResolvedValue(room as never);

            const req = mockReq({ params: { chatId: '1' } } as Partial<AuthRequest>);
            const res = mockRes();

            await ChatController.getChatRoomByID(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(ChatService.getChatRoomByID).toHaveBeenCalledWith(1, 10);
        });
    });

    // ===== findOrCreateChatRoom =====
    describe('findOrCreateChatRoom', () => {
        it('should return 200 with chat room', async () => {
            const room = { Chat_ID: 1 };
            vi.mocked(ChatService.findOrCreateChatRoom).mockResolvedValue(room as never);

            const req = mockReq({ body: { sellerId: 20, productId: 100 } });
            const res = mockRes();

            await ChatController.findOrCreateChatRoom(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(ChatService.findOrCreateChatRoom).toHaveBeenCalledWith(10, 20, 100);
        });

        it('should call next with error when sellerId is missing', async () => {
            const req = mockReq({ body: { productId: 100 } });
            const res = mockRes();

            await ChatController.findOrCreateChatRoom(req, res, next);

            expect(next).toHaveBeenCalled();
            const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
            expect(error.message).toBe('sellerId and productId are required');
        });
    });

    // ===== deleteChatRoom =====
    describe('deleteChatRoom', () => {
        it('should return 200 on successful delete', async () => {
            vi.mocked(ChatService.deleteChatRoom).mockResolvedValue(true);

            const req = mockReq({ params: { chatId: '1' } } as Partial<AuthRequest>);
            const res = mockRes();

            await ChatController.deleteChatRoom(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Chat room deleted successfully' });
        });
    });

    // ===== getMessages =====
    describe('getMessages', () => {
        it('should return 200 with paginated messages', async () => {
            const result = { data: [], pagination: { page: 1, limit: 50, hasMore: false } };
            vi.mocked(ChatService.getMessagesByChatID).mockResolvedValue(result);

            const req = mockReq({
                params: { chatId: '1' },
                query: { page: '2' },
            } as Partial<AuthRequest>);
            const res = mockRes();

            await ChatController.getMessages(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(ChatService.getMessagesByChatID).toHaveBeenCalledWith(1, 10, 2);
        });

        it('should default to page 1 when page query is missing', async () => {
            const result = { data: [], pagination: { page: 1, limit: 50, hasMore: false } };
            vi.mocked(ChatService.getMessagesByChatID).mockResolvedValue(result);

            const req = mockReq({ params: { chatId: '1' } } as Partial<AuthRequest>);
            const res = mockRes();

            await ChatController.getMessages(req, res, next);

            expect(ChatService.getMessagesByChatID).toHaveBeenCalledWith(1, 10, 1);
        });
    });

    // ===== sendMessage =====
    describe('sendMessage', () => {
        it('should return 201 with messageId', async () => {
            vi.mocked(ChatService.sendMessage).mockResolvedValue({ messageId: 42 });

            const req = mockReq({
                params: { chatId: '1' },
                body: { content: 'Hello!', type: 'text' },
            } as Partial<AuthRequest>);
            const res = mockRes();

            await ChatController.sendMessage(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Message sent successfully',
                messageId: 42,
            });
        });

        it('should call next with error when content is empty', async () => {
            const req = mockReq({
                params: { chatId: '1' },
                body: { content: '   ' },
            } as Partial<AuthRequest>);
            const res = mockRes();

            await ChatController.sendMessage(req, res, next);

            expect(next).toHaveBeenCalled();
            const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
            expect(error.message).toBe('Message content is required');
        });

        it('should default to text type when type is not image', async () => {
            vi.mocked(ChatService.sendMessage).mockResolvedValue({ messageId: 43 });

            const req = mockReq({
                params: { chatId: '1' },
                body: { content: 'Hello!' },
            } as Partial<AuthRequest>);
            const res = mockRes();

            await ChatController.sendMessage(req, res, next);

            expect(ChatService.sendMessage).toHaveBeenCalledWith(1, 10, 'Hello!', 'text');
        });

        it('should emit auto reply when service returns one', async () => {
            const emit = vi.fn();
            const to = vi.fn().mockReturnValue({ emit });
            vi.mocked(ChatService.sendMessage).mockResolvedValue({
                messageId: 42,
                autoReply: {
                    Messages_ID: 77,
                    Chat_ID: 1,
                    Sender_ID: 20,
                    Content: 'ตอบกลับอัตโนมัติ',
                    MessagesType: 'text',
                    SenderName: 'Seller',
                },
            });

            const req = mockReq({
                params: { chatId: '1' },
                body: { content: 'Hello!', type: 'text' },
                app: { get: vi.fn().mockReturnValue({ to }) } as unknown as AuthRequest["app"],
            });
            const res = mockRes();

            await ChatController.sendMessage(req, res, next);

            expect(to).toHaveBeenCalledWith('1');
            expect(emit).toHaveBeenCalledWith('newMessage', expect.objectContaining({
                Messages_ID: 77,
                Content: 'ตอบกลับอัตโนมัติ',
            }));
        });
    });

    // ===== markAsRead =====
    describe('markAsRead', () => {
        it('should return 200 on success', async () => {
            vi.mocked(ChatService.markMessagesAsRead).mockResolvedValue(true);

            const req = mockReq({ params: { chatId: '1' } } as Partial<AuthRequest>);
            const res = mockRes();

            await ChatController.markAsRead(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Messages marked as read' });
        });
    });

    // ===== getUnreadCount =====
    describe('getUnreadCount', () => {
        it('should return 200 with unread count', async () => {
            vi.mocked(ChatService.getUnreadMessagesCountForUser).mockResolvedValue(5);

            const req = mockReq();
            const res = mockRes();

            await ChatController.getUnreadCount(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, unreadCount: 5 });
        });
    });
});
