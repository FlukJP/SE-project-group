import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/me', authenticateJWT, UserController.getProfile);
router.put('/me', authenticateJWT, UserController.updateProfile);
router.get('/:id', UserController.getUserByID);

export default router;
