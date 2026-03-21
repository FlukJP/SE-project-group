import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';
import { ENV } from '../config/env';
import { UserModel } from '../models/UserModel';
import redisClient, { connectRedis } from '../config/redis';

export interface AuthPayload {
    userID: number;
    role: 'customer' | 'admin';
}

export interface AuthRequest extends Request {
    user?: AuthPayload;
}

/** Verify the Bearer token, check the blacklist, and attach the user payload to the request */
export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) throw new AppError("Authorization header is missing", 401);
        const token = authHeader.split(' ')[1];

        // Check if the token has been blacklisted (logged out)
        await connectRedis();
        const isBlacklisted = await redisClient.get(`blacklist:${token}`);
        if (isBlacklisted) throw new AppError("Token has been revoked", 401);

        const decoded = jwt.verify(token, ENV.JWT_SECRET, {
            issuer: ENV.JWT_ISSUER,
            audience: ENV.JWT_AUDIENCE,
        }) as AuthPayload;
        const user = await UserModel.findByIDSafe(decoded.userID);
        if (!user) throw new AppError("User not found", 404);
        if (user.Is_Banned) throw new AppError("User is banned", 403);
        req.user = { userID: decoded.userID, role: user.Role };
        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return next(new AppError("Token has expired", 401));
        } else if (err instanceof jwt.JsonWebTokenError) {
            return next(new AppError("Invalid token", 401));
        }
        return next(err);
    }
};

/** Return a middleware that allows access only to users whose role is in the provided list */
export const authorizeRoles = (roles: ('customer' | 'admin')[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);
            if (!roles.includes(req.user.role)) throw new AppError("Forbidden: Insufficient permissions", 403);
            next();
        } catch (err) {
            next(err);
        }
    };
};

/** Block access if the user has not verified both their email and phone number */
export const requireVerified = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new AppError("Unauthorized", 401);
        const user = await UserModel.findByIDSafe(req.user.userID);
        if (!user) throw new AppError("User not found", 404);
        if (!user.Is_Email_Verified) {
            throw new AppError("Please verify your email via OTP before using this feature", 403);
        }
        if (!user.Is_Phone_Verified) {
            throw new AppError("Please verify your phone number via OTP before using this feature", 403);
        }
        next();
    } catch (err) {
        next(err);
    }
};
