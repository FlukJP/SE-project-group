import { ENV } from "@/src/config/serverEnv";
import jwt from "jsonwebtoken";

export interface TokenPayload extends jwt.JwtPayload {
    userID: number;
    role: "customer" | "admin";
}

/** Signs and returns a short-lived JWT access token for the given payload. */
export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, ENV.JWT_SECRET as string, {
        expiresIn: ENV.JWT_EXPIRES_IN,
        issuer: ENV.JWT_ISSUER,
        audience: ENV.JWT_AUDIENCE,
    });
};

/** Signs and returns a long-lived JWT refresh token for the given user ID. */
export const generateRefreshToken = (payload: { userID: number }): string => {
    return jwt.sign(payload, ENV.JWT_REFRESH_SECRET as string, {
        expiresIn: ENV.JWT_REFRESH_EXPIRES_IN,
        issuer: ENV.JWT_ISSUER,
        audience: ENV.JWT_AUDIENCE,
    } as jwt.SignOptions);
};

/** Verify an access token and return the decoded payload as TokenPayload. */
export const verifyAccessToken = (
    token: string,
    options?: { ignoreExpiration?: boolean }
): TokenPayload => {
    const decoded = jwt.verify(token, ENV.JWT_SECRET as string, {
        issuer: ENV.JWT_ISSUER,
        audience: ENV.JWT_AUDIENCE,
        ignoreExpiration: options?.ignoreExpiration ?? false,
    });

    // narrow out the `string` case (jwt.verify returns string | JwtPayload)
    if (typeof decoded === "string") {
        throw new jwt.JsonWebTokenError("Invalid token: unexpected string result");
    }

    return decoded as TokenPayload;
};

/** Verify a refresh token and return the decoded payload as TokenPayload. */
export const verifyRefreshToken = (token: string): TokenPayload => {
    const decoded = jwt.verify(token, ENV.JWT_REFRESH_SECRET as string, {
        issuer: ENV.JWT_ISSUER,
        audience: ENV.JWT_AUDIENCE,
    });

    if (typeof decoded === "string") {
        throw new jwt.JsonWebTokenError("Invalid token: unexpected string result");
    }

    return decoded as TokenPayload;
};
