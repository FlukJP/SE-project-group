import { Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { AuthRequest } from "../middleware/auth.middleware";
import { AppError } from "../errors/AppError";

export const AuthController = {
    /** Handle user registration and respond with the new user ID */
    register: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { username, email, password, phone, address } = req.body;

            const insertId = await AuthService.register({
                Username: username,
                Email: email,
                Password: password,
                Phone_number: phone,
                Address: address || undefined,
                Role: "customer",
            });

            res.status(201).json({
                success: true,
                message: "Registration successful. A verification OTP has been sent to your email.",
                userId: insertId,
            });
        } catch (error) {
            next(error);
        }
    },

    /** Authenticate the user and return access and refresh tokens */
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

    /** Invalidate the current access token and remove the stored refresh token */
    logout: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const token = req.headers.authorization?.split(" ")[1];
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

    /** Exchange a valid refresh token for a new access token */
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

    /** Update the authenticated user's password after verifying the old password */
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

    /** Send a one-time password to the user's email address */
    requestOTP: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { email } = req.body;
            if (!email) throw new AppError("Email is required", 400);

            await AuthService.requestOTP(email);

            res.status(200).json({
                success: true,
                message: "OTP sent to your email",
            });
        } catch (error) {
            next(error);
        }
    },

    /** Verify the submitted OTP and return new tokens on success */
    verifyOTP: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const email = req.body.email?.toLowerCase().trim();
            const otp = req.body.otp?.toString().trim();
            if (!email || !otp) throw new AppError("Email and OTP are required", 400);

            const result = await AuthService.verifyOTP(email, otp);

            res.status(200).json({
                success: true,
                message: "OTP verified successfully",
                access_token: result.access_token,
                refresh_token: result.refresh_token,
            });
        } catch (error) {
            next(error);
        }
    },

    /** Reset the user's password after verifying the OTP */
    resetPassword: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { email, otp, newPassword } = req.body;
            if (!email || !otp || !newPassword) throw new AppError("Email, OTP and new password are required", 400);
            await AuthService.resetPasswordWithOTP(email, otp, newPassword);

            res.status(200).json({
                success: true,
                message: "Password reset successfully",
            });
        } catch (error) {
            next(error);
        }
    },

    /** Send a phone verification OTP to the user's registered email address */
    requestPhoneOTP: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { phone } = req.body;
            if (!phone) throw new AppError("Phone number is required", 400);
            await AuthService.requestPhoneOTP(phone);

            res.status(200).json({
                success: true,
                message: "Phone verification OTP has been sent to your email",
                warning: "OTP was sent via email instead of SMS because the SMS provider is not yet connected",
            });
        } catch (error) {
            next(error);
        }
    },

    /** Verify the phone OTP and return new tokens on success */
    verifyPhoneOTP: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { phone, otp } = req.body;
            if (!phone || !otp) throw new AppError("Phone number and OTP are required", 400);
            const result = await AuthService.verifyPhoneOTP(phone, otp);

            res.status(200).json({
                success: true,
                message: "Phone number verified successfully",
                ...result,
            });
        } catch (error) {
            next(error);
        }
    },

    /** Verify a Firebase ID token to confirm phone ownership and return new tokens */
    verifyPhoneFirebase: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { idToken } = req.body;
            if (!idToken) throw new AppError("Firebase ID token is required", 400);
            const result = await AuthService.verifyPhoneFirebase(idToken);

            res.status(200).json({
                success: true,
                message: "Phone number verified successfully",
                ...result,
            });
        } catch (error) {
            next(error);
        }
    },
};