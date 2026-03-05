import { ENV } from "@/config/env";
import jwt from "jsonwebtoken";

export interface TokenPayload extends jwt.JwtPayload {
    userID: number;
    role: string;
}

export const generateAccessToken = (payload: TokenPayload) => {
    return jwt.sign(payload, ENV.JWT_SECRET as string, {
        expiresIn: ENV.JWT_EXPIRES_IN,
        issuer: ENV.JWT_ISSUER,
        audience: ENV.JWT_AUDIENCE,
    });
};

export const generateRefreshToken = (payload: { userID: number }) => {
    return jwt.sign(
        payload,
        ENV.JWT_REFRESH_SECRET as string,
        {
            expiresIn: ENV.JWT_REFRESH_EXPIRES_IN,
            issuer: ENV.JWT_ISSUER,
            audience: ENV.JWT_AUDIENCE,
        } as jwt.SignOptions,
    );
};
