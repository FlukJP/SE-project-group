import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from '@/src/services/chat.service';
import { ChatModel } from '@/src/models/chatModel';
import { MessageModel } from '@/src/models/messageModel';
import { AppError } from '@/src/errors/AppError';
import type { Chat } from '@/src/types/Chat';

vi.mock('@/src/models/chatModel');
vi.mock('@/src/models/messageModel');

const mockChat: Chat = {
    Chat_ID: 1,
    Participant_1: 10,
    Participant_2: 20,
    Chats_product_ID: 100,
};

describe('ChatService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    // ===== getChatRoomByID =====
    describe('getChatRoomByID', () => {
        it('should return chat room when user is participant', async () => {
            vi.mocked(ChatModel.findByID).mockResolvedValue(mockChat);

            const result = await ChatService.getChatRoomByID(1, 10);
            expect(result).toEqual(mockChat);
            expect(ChatModel.findByID).toHaveBeenCalledWith(1);
        });

        it('should throw 404 when chat room not found', async () => {
            vi.mocked(ChatModel.findByID).mockResolvedValue(null);

            await expect(ChatService.getChatRoomByID(999, 10)).rejects.toThrow(AppError);
            await expect(ChatService.getChatRoomByID(999, 10)).rejects.toThrow('Chat room not found');
        });

        it('should throw 403 when user is not a participant', async () => {
            vi.mocked(ChatModel.findByID).mockResolvedValue(mockChat);

            await expect(ChatService.getChatRoomByID(1, 999)).rejects.toThrow('Unauthorized to access this chat room');
        });

        it('should throw 400 when chatID or userID is missing', async () => {
            await expect(ChatService.getChatRoomByID(0, 10)).rejects.toThrow('Chat ID and User ID are required');
            await expect(ChatService.getChatRoomByID(1, 0)).rejects.toThrow('Chat ID and User ID are required');
        });
    });

    // ===== findOrCreateChatRoom =====
    describe('findOrCreateChatRoom', () => {
        it('should return existing chat if found', async () => {
            vi.mocked(ChatModel.findExistingChat).mockResolvedValue(mockChat);

            const result = await ChatService.findOrCreateChatRoom(10, 20, 100);
            expect(result).toEqual(mockChat);
            expect(ChatModel.createChatRoom).not.toHaveBeenCalled();
        });

        it('should create new chat if not found', async () => {
            vi.mocked(ChatModel.findExistingChat).mockResolvedValue(null);
            vi.mocked(ChatModel.createChatRoom).mockResolvedValue(1);
            vi.mocked(ChatModel.findByID).mockResolvedValue(mockChat);

            const result = await ChatService.findOrCreateChatRoom(10, 20, 100);
            expect(result).toEqual(mockChat);
            expect(ChatModel.createChatRoom).toHaveBeenCalledWith({
                Participant_1: 10,
                Participant_2: 20,
                Chats_product_ID: 100,
            });
        });

        it('should throw 400 when buyer and seller are the same', async () => {
            await expect(ChatService.findOrCreateChatRoom(10, 10, 100)).rejects.toThrow('Cannot create chat room with yourself');
        });

        it('should throw 400 when required params are missing', async () => {
            await expect(ChatService.findOrCreateChatRoom(0, 20, 100)).rejects.toThrow('Buyer ID, Seller ID and Product ID are required');
        });

        it('should throw 500 when create succeeds but findByID returns null', async () => {
            vi.mocked(ChatModel.findExistingChat).mockResolvedValue(null);
            vi.mocked(ChatModel.createChatRoom).mockResolvedValue(1);
            vi.mocked(ChatModel.findByID).mockResolvedValue(null);

            await expect(ChatService.findOrCreateChatRoom(10, 20, 100)).rejects.toThrow('Failed to create chat room');
        });
    });

    // ===== deleteChatRoom =====
    describe('deleteChatRoom', () => {
        it('should hide chat for Participant_1', async () => {
            vi.mocked(ChatModel.findByID).mockResolvedValue(mockChat);
            vi.mocked(ChatModel.hideChatForParticipant).mockResolvedValue(true);

            const result = await ChatService.deleteChatRoom(1, 10);
            expect(result).toBe(true);
            expect(ChatModel.hideChatForParticipant).toHaveBeenCalledWith(1, 'P1');
        });

        it('should hide chat for Participant_2', async () => {
            vi.mocked(ChatModel.findByID).mockResolvedValue(mockChat);
            vi.mocked(ChatModel.hideChatForParticipant).mockResolvedValue(true);

            const result = await ChatService.deleteChatRoom(1, 20);
            expect(result).toBe(true);
            expect(ChatModel.hideChatForParticipant).toHaveBeenCalledWith(1, 'P2');
        });

        it('should throw 403 when user is not a participant', async () => {
            vi.mocked(ChatModel.findByID).mockResolvedValue(mockChat);

            await expect(ChatService.deleteChatRoom(1, 999)).rejects.toThrow('Unauthorized to delete this chat room');
        });

        it('should throw 404 when chat room not found', async () => {
            vi.mocked(ChatModel.findByID).mockResolvedValue(null);

            await expect(ChatService.deleteChatRoom(999, 10)).rejects.toThrow('Chat room not found');
        });
    });

    // ===== getMessagesByChatID =====
    describe('getMessagesByChatID', () => {
        it('should return paginated messages', async () => {
            vi.mocked(ChatModel.findByID).mockResolvedValue(mockChat);
            const mockMessages = Array.from({ length: 50 }, (_, i) => ({
                Messages_ID: i + 1,
                Chat_ID: 1,
                Sender_ID: 10,
                Content: `msg ${i}`,
                MessagesType: 'text' as const,
                SenderName: 'User10',
            }));
            vi.mocked(MessageModel.findByChatID).mockResolvedValue(mockMessages);

            const result = await ChatService.getMessagesByChatID(1, 10, 1);
            expect(result.data).toHaveLength(50);
            expect(result.pagination).toEqual({ page: 1, limit: 50, hasMore: false });
        });

        it('should detect hasMore when more messages exist', async () => {
            vi.mocked(ChatModel.findByID).mockResolvedValue(mockChat);
            const mockMessages = Array.from({ length: 51 }, (_, i) => ({
                Messages_ID: i + 1,
                Chat_ID: 1,
                Sender_ID: 10,
                Content: `msg ${i}`,
                MessagesType: 'text' as const,
                SenderName: 'User10',
            }));
            vi.mocked(MessageModel.findByChatID).mockResolvedValue(mockMessages);

            const result = await ChatService.getMessagesByChatID(1, 10, 1);
            expect(result.data).toHaveLength(50);
            expect(result.pagination.hasMore).toBe(true);
        });

        it('should throw 403 when user is not a participant', async () => {
            vi.mocked(ChatModel.findByID).mockResolvedValue(mockChat);

            await expect(ChatService.getMessagesByChatID(1, 999, 1)).rejects.toThrow('Unauthorized to access messages');
        });
    });

    // ===== getChatInboxForUser =====
    describe('getChatInboxForUser', () => {
        it('should return chat rooms for user', async () => {
            vi.mocked(ChatModel.findByUserID).mockResolvedValue([]);

            const result = await ChatService.getChatInboxForUser(10);
            expect(result).toEqual([]);
            expect(ChatModel.findByUserID).toHaveBeenCalledWith(10);
        });

        it('should throw 400 when userID is missing', async () => {
            await expect(ChatService.getChatInboxForUser(0)).rejects.toThrow('User ID is required');
        });
    });

    // ===== getUnreadMessagesCountForUser =====
    describe('getUnreadMessagesCountForUser', () => {
        it('should return unread count', async () => {
            vi.mocked(MessageModel.countUnreadByUserID).mockResolvedValue(5);

            const result = await ChatService.getUnreadMessagesCountForUser(10);
            expect(result).toBe(5);
        });

        it('should throw 400 when userID is missing', async () => {
            await expect(ChatService.getUnreadMessagesCountForUser(0)).rejects.toThrow('User ID is required');
        });
    });

    // ===== sendMessage =====
    describe('sendMessage', () => {
        it('should send a text message successfully', async () => {
            vi.mocked(ChatModel.findByID).mockResolvedValue(mockChat);
            vi.mocked(MessageModel.createMessageTransaction).mockResolvedValue(42);

            const result = await ChatService.sendMessage(1, 10, 'Hello', 'text');
            expect(result).toBe(42);
            expect(MessageModel.createMessageTransaction).toHaveBeenCalledWith({
                Chat_ID: 1,
                Sender_ID: 10,
                Content: 'Hello',
                MessagesType: 'text',
            });
        });

        it('should send an image message successfully', async () => {
            vi.mocked(ChatModel.findByID).mockResolvedValue(mockChat);
            vi.mocked(MessageModel.createMessageTransaction).mockResolvedValue(43);

            const result = await ChatService.sendMessage(1, 10, 'http://img.url/pic.jpg', 'image');
            expect(result).toBe(43);
        });

        it('should throw 403 when sender is not a participant', async () => {
            vi.mocked(ChatModel.findByID).mockResolvedValue(mockChat);

            await expect(ChatService.sendMessage(1, 999, 'Hello', 'text')).rejects.toThrow('Unauthorized to send message');
        });

        it('should throw 400 when content is empty', async () => {
            await expect(ChatService.sendMessage(1, 10, '', 'text')).rejects.toThrow('Chat ID, Sender ID and content are required');
        });
    });

    // ===== markMessagesAsRead =====
    describe('markMessagesAsRead', () => {
        it('should mark messages as read', async () => {
            vi.mocked(ChatModel.findByID).mockResolvedValue(mockChat);
            vi.mocked(MessageModel.updateReadStatus).mockResolvedValue();

            const result = await ChatService.markMessagesAsRead(1, 10);
            expect(result).toBe(true);
            expect(MessageModel.updateReadStatus).toHaveBeenCalledWith(1, 10);
        });

        it('should throw 403 when user is not a participant', async () => {
            vi.mocked(ChatModel.findByID).mockResolvedValue(mockChat);

            await expect(ChatService.markMessagesAsRead(1, 999)).rejects.toThrow('Unauthorized to mark messages');
        });

        it('should throw 404 when chat not found', async () => {
            vi.mocked(ChatModel.findByID).mockResolvedValue(null);

            await expect(ChatService.markMessagesAsRead(999, 10)).rejects.toThrow('Chat room not found');
        });
    });
});
