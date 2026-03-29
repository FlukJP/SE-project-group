import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { uploadUserAvatar, handleUploadError, validateImageMagicBytes } from '../middleware/upload.middleware';
import { validateBody, validateParams, idParam, profileUpdateSchema } from '../middleware/validate.middleware';

const router = Router();

router.get('/me', authenticateJWT, UserController.getProfile);
router.put('/me', authenticateJWT, validateBody(profileUpdateSchema, { allowUnknown: false }), UserController.updateProfile);
router.put('/me/avatar', authenticateJWT, uploadUserAvatar.single('avatar'), handleUploadError, validateImageMagicBytes, UserController.uploadAvatar);
router.get('/:id', validateParams(idParam), UserController.getUserByID);

export default router;
