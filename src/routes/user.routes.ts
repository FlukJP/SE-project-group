import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { uploadUserAvatar, handleUploadError } from '../middleware/upload.middleware';

const router = Router();

router.get('/me', authenticateJWT, UserController.getProfile);
router.put('/me', authenticateJWT, UserController.updateProfile);
router.put('/me/avatar', authenticateJWT, uploadUserAvatar.single('avatar'), handleUploadError, UserController.uploadAvatar);
router.get('/:id', UserController.getUserByID);

export default router;
