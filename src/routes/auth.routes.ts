import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/request-otp', AuthController.requestOTP);
router.post('/verify-otp', AuthController.verifyOTP);
router.post('/request-phone-otp', AuthController.requestPhoneOTP);
router.post('/verify-phone-otp', AuthController.verifyPhoneOTP);
router.post('/reset-password', AuthController.resetPassword);

router.post('/logout', authenticateJWT, AuthController.logout);
router.post('/change-password', authenticateJWT, AuthController.changePassword);

export default router;
