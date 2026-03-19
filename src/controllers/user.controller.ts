import { Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { UserService } from '../services/user.service';
import { UserModel } from '../models/UserModel';
import { AuthRequest } from '../middleware/auth.middleware';
import { deleteUploadedFile } from '../utils/uploadHelpers';
import { UploadFolderType } from '../types/upload';

export const UserController = {
    // 1.Get My Profile
    getProfile: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);

            const profile = await UserService.getProfile({ userID: req.user.userID });

            res.status(200).json({ success: true, data: profile });
        } catch (error) {
            next(error);
        }
    },

    // 2.Get User by ID - public profile
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

    // 3.Update Profile
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

    // 4.Upload Avatar
    uploadAvatar: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);

            const file = req.file as Express.Multer.File | undefined;
            if (!file) throw new AppError("Image file is required", 400);

            const avatarUrl = `/uploads/users/${file.filename}`;
            const currentUser = await UserModel.findByIDSafe(req.user.userID);
            if (currentUser?.Avatar_URL) {
                const oldFilename = currentUser.Avatar_URL.split('/').pop();
                if (oldFilename) deleteUploadedFile(oldFilename, UploadFolderType.USER);
            }

            await UserModel.updateUser(req.user.userID, { Avatar_URL: avatarUrl });

            res.status(200).json({
                success: true,
                message: "Avatar uploaded successfully",
                avatar_url: avatarUrl,
            });
        } catch (error) {
            const file = req.file as Express.Multer.File | undefined;
            if (file) {
                deleteUploadedFile(file.filename, UploadFolderType.USER);
            }
            next(error);
        }
    },
};
