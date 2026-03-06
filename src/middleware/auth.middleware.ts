import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';
import 'dotenv/config';
import { UserModel } from '../models/UserModel';

export interface AuthPayload {
    userID: number;
    role: 'customer' | 'seller' | 'admin';
}

export interface AuthRequest extends Request {
    user?: AuthPayload;
}

// Authentication Middleware
export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try{
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) throw new AppError("Authorization header is missing", 401);
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_ACCESS_SECRET;
        if (!secret) throw new AppError("JWT secret is not configured", 500);
        const decoded = jwt.verify(token, secret) as AuthPayload;
        const user = await UserModel.findByID(decoded.userID);
        if (!user) throw new AppError("User not found", 404);
        if (user.Is_Banned) throw new AppError("User is banned", 403);
        req.user = { userID: decoded.userID, role: user.Role  };
        next();
    }
    catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return next(new AppError("Token has expired", 401));
        }
        else if (err instanceof jwt.JsonWebTokenError) {
            return next(new AppError("Invalid token", 401));
        }
        return next(err);
    }
};

// Authorization Middleware
export const authorizeRoles = (roles: ('customer' | 'seller' | 'admin')[]) => {
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