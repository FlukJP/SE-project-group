import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticateJWT, requireVerified } from '../middleware/auth.middleware';
import {
    validateBody,
    validateParams,
    createChatSchema,
    sendMessageSchema,
    chatIdParam,
} from '../middleware/validate.middleware';

const router = Router();

router.get('/', authenticateJWT, requireVerified, ChatController.getChatRooms);
router.get('/unread', authenticateJWT, requireVerified, ChatController.getUnreadCount);
router.post('/', authenticateJWT, requireVerified, validateBody(createChatSchema), ChatController.findOrCreateChatRoom);
router.get('/:chatId', authenticateJWT, requireVerified, validateParams(chatIdParam), ChatController.getChatRoomByID);
router.delete('/:chatId', authenticateJWT, requireVerified, validateParams(chatIdParam), ChatController.deleteChatRoom);
router.get('/:chatId/messages', authenticateJWT, requireVerified, validateParams(chatIdParam), ChatController.getMessages);
router.post('/:chatId/messages', authenticateJWT, requireVerified, validateParams(chatIdParam), validateBody(sendMessageSchema), ChatController.sendMessage);
router.patch('/:chatId/read', authenticateJWT, requireVerified, validateParams(chatIdParam), ChatController.markAsRead);

export default router;
