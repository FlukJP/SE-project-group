import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { loginLimiter, signupLimiter, passwordResetLimiter } from '../middleware/rateLimit.middleware';
import {
    validateBody,
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    changePasswordSchema,
    requestOtpSchema,
    verifyOtpSchema,
    resetPasswordSchema,
    requestPhoneOtpSchema,
    verifyPhoneOtpSchema,
    verifyPhoneFirebaseSchema,
} from '../middleware/validate.middleware';

const router = Router();

router.post('/register', signupLimiter, validateBody(registerSchema), AuthController.register);
router.post('/login', loginLimiter, validateBody(loginSchema), AuthController.login);
router.post('/refresh-token', validateBody(refreshTokenSchema), AuthController.refreshToken);
router.post('/request-otp', passwordResetLimiter, validateBody(requestOtpSchema), AuthController.requestOTP);
router.post('/verify-otp', validateBody(verifyOtpSchema), AuthController.verifyOTP);
router.post('/request-phone-otp', passwordResetLimiter, validateBody(requestPhoneOtpSchema), AuthController.requestPhoneOTP);
router.post('/verify-phone-otp', validateBody(verifyPhoneOtpSchema), AuthController.verifyPhoneOTP);
router.post('/verify-phone-firebase', validateBody(verifyPhoneFirebaseSchema), AuthController.verifyPhoneFirebase);
router.post('/reset-password', passwordResetLimiter, validateBody(resetPasswordSchema), AuthController.resetPassword);

router.post('/logout', authenticateJWT, AuthController.logout);
router.post('/change-password', authenticateJWT, validateBody(changePasswordSchema), AuthController.changePassword);

export default router;
