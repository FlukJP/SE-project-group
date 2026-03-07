import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, ChatController.getChatRooms);
router.get('/unread', authenticateJWT, ChatController.getUnreadCount);
router.post('/', authenticateJWT, ChatController.findOrCreateChatRoom);
router.get('/:chatId', authenticateJWT, ChatController.getChatRoomByID);
router.delete('/:chatId', authenticateJWT, ChatController.deleteChatRoom);
router.get('/:chatId/messages', authenticateJWT, ChatController.getMessages);
router.post('/:chatId/messages', authenticateJWT, ChatController.sendMessage);
router.patch('/:chatId/read', authenticateJWT, ChatController.markAsRead);

export default router;
