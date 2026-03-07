import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticateJWT, requireVerified } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, requireVerified, ChatController.getChatRooms);
router.get('/unread', authenticateJWT, requireVerified, ChatController.getUnreadCount);
router.post('/', authenticateJWT, requireVerified, ChatController.findOrCreateChatRoom);
router.get('/:chatId', authenticateJWT, requireVerified, ChatController.getChatRoomByID);
router.delete('/:chatId', authenticateJWT, requireVerified, ChatController.deleteChatRoom);
router.get('/:chatId/messages', authenticateJWT, requireVerified, ChatController.getMessages);
router.post('/:chatId/messages', authenticateJWT, requireVerified, ChatController.sendMessage);
router.patch('/:chatId/read', authenticateJWT, requireVerified, ChatController.markAsRead);

export default router;
