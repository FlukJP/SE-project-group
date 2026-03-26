import { Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { UserService } from '../services/user.service';
import { UserModel } from '../models/UserModel';
import { AuthRequest } from '../middleware/auth.middleware';
import { uploadToStorage, deleteFromStorage, generateUniqueFilename } from '../services/storage.Service';

export const UserController = {
    /** Return the full profile of the currently authenticated user */
    getProfile: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);

            const profile = await UserService.getProfile({ userID: req.user.userID });

            res.status(200).json({ success: true, data: profile });
        } catch (error) {
            next(error);
        }
    },

    /** Return the public profile (ID, username, rating, avatar) of any user by ID */
    getUserByID: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = Number(req.params.id);
            if (!userId || userId <= 0) throw new AppError("Invalid user ID", 400);

            const user = await UserModel.findByIDSafe(userId);
            if (!user) throw new AppError("User not found", 404);
            const publicProfile = {
                User_ID: user.User_ID,
                Username: user.Username,
                RatingScore: user.RatingScore,
                Avatar_URL: user.Avatar_URL,
            };

            res.status(200).json({ success: true, data: publicProfile });
        } catch (error) {
            next(error);
        }
    },

    /** Update allowed profile fields for the authenticated user */
    updateProfile: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);

            await UserService.updateProfile({
                userID: req.user.userID,
                updateData: req.body,
            });

            res.status(200).json({
                success: true,
                message: "Profile updated successfully",
            });
        } catch (error) {
            next(error);
        }
    },

    /** Save an uploaded avatar image, delete the old one, and persist the new URL */
    uploadAvatar: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);

            const file = req.file as Express.Multer.File | undefined;
            if (!file) throw new AppError("Image file is required", 400);

            const avatarUrl = await uploadToStorage(
                file.buffer,
                file.mimetype,
                'users',
                generateUniqueFilename('avatar', file.mimetype),
            );

            const currentUser = await UserModel.findByIDSafe(req.user.userID);
            if (currentUser?.Avatar_URL) {
                deleteFromStorage(currentUser.Avatar_URL).catch(() => {});
            }

            await UserModel.updateUser(req.user.userID, { Avatar_URL: avatarUrl });

            res.status(200).json({
                success: true,
                message: "Avatar uploaded successfully",
                avatar_url: avatarUrl,
            });
        } catch (error) {
            next(error);
        }
    },
};
