import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../errors/AppError';

export const AuthController = {
    // 1.สมัครสมาชิก (Register)
    register: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { username, email, password, phone } = req.body;

            const insertId = await AuthService.register({
                Username: username,
                Email: email,
                Password: password,
                Phone_number: phone,
                Role: 'customer',
            });

            res.status(201).json({
                success: true,
                message: "Registration successful. Please check your email for OTP verification.",
                userId: insertId,
            });
        } catch (error) {
            next(error);
        }
    },

    // 2.เข้าสู่ระบบ (Login)
    login: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login({ email, password });

            res.status(200).json({
                success: true,
                message: "Login successful",
                ...result,
            });
        } catch (error) {
            next(error);
        }
    },

    // 3.ออกจากระบบ (Logout)
    logout: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const authHeader = req.headers.authorization;
            const token = authHeader?.split(' ')[1];
            if (!token) throw new AppError("Token is required", 400);

            await AuthService.logout(token);

            res.status(200).json({
                success: true,
                message: "Logout successful",
            });
        } catch (error) {
            next(error);
        }
    },

    // 4.Refresh token
    refreshToken: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { refresh_token } = req.body;
            if (!refresh_token) throw new AppError("Refresh token is required", 400);

            const result = await AuthService.refreshToken(refresh_token);

            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    },

    // 5.เปลี่ยนรหัสผ่าน (Change Password)
    changePassword: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);

            const { oldPassword, newPassword } = req.body;
            await AuthService.changePassword(req.user.userID, oldPassword, newPassword);

            res.status(200).json({
                success: true,
                message: "Password changed successfully",
            });
        } catch (error) {
            next(error);
        }
    },

    // 6.ขอ OTP (Request OTP)
    requestOTP: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { email } = req.body;
            await AuthService.requestOTP(email);

            res.status(200).json({
                success: true,
                message: "OTP sent to your email",
            });
        } catch (error) {
            next(error);
        }
    },

    // 7.ยืนยัน OTP (Verify OTP)
    verifyOTP: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { email, otp } = req.body;
            const result = await AuthService.verifyOTP(email, otp);

            res.status(200).json({
                success: true,
                message: "OTP verified successfully",
                ...result,
            });
        } catch (error) {
            next(error);
        }
    },

    // 8.รีเซ็ตรหัสผ่านด้วย OTP (Reset Password)
    resetPassword: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { email, otp, newPassword } = req.body;
            await AuthService.resetPasswordWithOTP(email, otp, newPassword);

            res.status(200).json({
                success: true,
                message: "Password reset successfully",
            });
        } catch (error) {
            next(error);
        }
    },

    // 9. ขอ OTP ยืนยันเบอร์โทร (Request Phone OTP)
    requestPhoneOTP: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { phone } = req.body;
            await AuthService.requestPhoneOTP(phone);

            res.status(200).json({
                success: true,
                message: "OTP สำหรับยืนยันเบอร์โทรถูกส่งไปยังอีเมลของคุณแล้ว",
            });
        } catch (error) {
            next(error);
        }
    },

    // 10. ยืนยัน OTP เบอร์โทร (Verify Phone OTP)
    verifyPhoneOTP: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { phone, otp } = req.body;
            const result = await AuthService.verifyPhoneOTP(phone, otp);

            res.status(200).json({
                success: true,
                message: "ยืนยันเบอร์โทรสำเร็จ",
                ...result,
            });
        } catch (error) {
            next(error);
        }
    },
};
