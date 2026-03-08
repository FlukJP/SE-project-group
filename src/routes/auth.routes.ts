import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { loginLimiter, signupLimiter, passwordResetLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/register', signupLimiter, AuthController.register);
router.post('/login', loginLimiter, AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/request-otp', passwordResetLimiter, AuthController.requestOTP);
router.post('/verify-otp', AuthController.verifyOTP);
router.post('/request-phone-otp', passwordResetLimiter, AuthController.requestPhoneOTP);
router.post('/verify-phone-otp', AuthController.verifyPhoneOTP);
router.post('/reset-password', passwordResetLimiter, AuthController.resetPassword);

router.post('/logout', authenticateJWT, AuthController.logout);
router.post('/change-password', authenticateJWT, AuthController.changePassword);

export default router;
