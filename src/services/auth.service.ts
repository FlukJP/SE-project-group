import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User, Role } from "@/src/types/User";
import { UserModel } from "@/src/models/UserModel";
import { AppError } from "@/src/errors/AppError";
import { sendEmail } from '@/src/utils/emailSender';
import { validateEmail, validatePassword, validatePhoneNumber } from '@/src/utils/validators';
import { ENV } from "@/src/config/env";
import redisClient, { connectRedis } from "@/src/config/redis";
import { OTP_TTL_SECONDS, RATE_LIMIT_TTL_SECONDS, MAX_OTP_REQUESTS, MAX_OTP_ATTEMPTS, SALT_ROUNDS } from "@/src/config/constants";
import { REFRESH_TOKEN_TTL_SECONDS } from "@/src/config/constants";
import { generateAccessToken, generateRefreshToken, TokenPayload } from "@/src/utils/jwt";
import firebaseAdmin from "@/src/config/firebaseAdmin";

// Redis (rate limiters)
const checkRateLimit = async (key: string, limit: number, ttlSeconds: number): Promise<void> => {
    await connectRedis();
    const countValue = await redisClient.incr(key);
    if (countValue === 1) await redisClient.expire(key, ttlSeconds);

    if (countValue > limit) {
        const ttl = await redisClient.ttl(key);
        const minutes = Math.ceil(ttl / 60);
        throw new AppError(`Too many requests. Please try again in ${minutes} minute(s).`, 429);
    }
};

const roleHierarchy: Record<Role, number> = {
    customer: 1,
    seller: 2,
    admin: 3
};

export const AuthService = {
    // 1.Register
    register: async (userData: User): Promise<number> => {
        if (!userData.Email || !userData.Password || !userData.Phone_number) throw new AppError("Email, Password and Phone number are required", 400);
        if (!validateEmail(userData.Email)) throw new AppError("Invalid email format", 400);
        if (!validatePassword(userData.Password)) throw new AppError("Password must be at least 8 characters long", 400);
        if (!validatePhoneNumber(userData.Phone_number)) throw new AppError("Phone number must be 10 digits", 400);

        const existingUser = await UserModel.findByEmail(userData.Email);
        if (existingUser) throw new AppError("Email already in use", 409);

        const newUser: User = {
            ...userData,
            Password: await bcrypt.hash(userData.Password, SALT_ROUNDS),
            Role: 'customer',
        }

        const insertId = await UserModel.createUser(newUser);
        await AuthService.requestOTP(userData.Email);

        return insertId
    },

    // 2.Login
    login: async (params: { email: string; password: string }) => {
        if (!params.email || !params.password) throw new AppError("Email and Password are required", 400);

        const lockKey = `login_lock:${params.email}`;
        const isLocked = await redisClient.get(lockKey);
        if (isLocked) throw new AppError("Account is temporarily locked due to many failed attempts. Try again in 15 minutes.", 429);

        const user = await UserModel.findByEmail(params.email);
        if (!user || !user.User_ID) throw new AppError("Invalid email or password", 401);

        const isPasswordValid = await bcrypt.compare(params.password, user.Password as string);
        if (!isPasswordValid) {
            const attemptsKey = `login_attempts:${params.email}`;
            const attempts = await redisClient.incr(attemptsKey);

            if (attempts === 1) await redisClient.expire(attemptsKey, 15 * 60);
            if (attempts >= 5) {
                await redisClient.setEx(lockKey, 15 * 60, "locked");
                await redisClient.del(attemptsKey);
                throw new AppError("Too many failed attempts. Account locked for 15 minutes.", 429);
            }
            throw new AppError("Invalid email or password", 401);
        }

        const accessToken = generateAccessToken({ userID: user.User_ID, role: user.Role });
        const refreshToken = generateRefreshToken({ userID: user.User_ID });
        await redisClient.setEx(`refresh_token:${user.User_ID}`, REFRESH_TOKEN_TTL_SECONDS, refreshToken);

        const { Password, ...userWithoutPassword } = user;
        return { access_token: accessToken, refresh_token: refreshToken, user: userWithoutPassword };
    },

    // 3.Logout
    logout: async (token: string): Promise<void> => {
        if (!token) throw new AppError("Token is required", 400);
        let decoded: TokenPayload;
        try {
            decoded = jwt.verify(token, ENV.JWT_SECRET as string, {
                issuer: ENV.JWT_ISSUER, audience: ENV.JWT_AUDIENCE, ignoreExpiration: true
            }) as TokenPayload;
        } catch (error) {
            throw new AppError("Invalid token signature", 400);
        }

        if (!decoded || !decoded.exp || !decoded.userID) throw new AppError("Invalid token payload", 400);
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) await redisClient.setEx(`blacklist:${token}`, ttl, "blacklisted");
        await redisClient.del(`refresh_token:${decoded.userID}`);
    },

    // 4.Token verification
    verifyToken: async (token: string): Promise<{ userID: number; role: string }> => {
        if (!token) throw new AppError("Token is required", 400);
        const isBlacklisted = await redisClient.get(`blacklist:${token}`);
        if (isBlacklisted) throw new AppError("Token has been revoked", 401);
        try {
            const decoded = jwt.verify(token, ENV.JWT_SECRET, { issuer: ENV.JWT_ISSUER, audience: ENV.JWT_AUDIENCE }) as TokenPayload;
            return { userID: decoded.userID, role: decoded.role };
        }
        catch (err) {
            throw new AppError("Invalid or expired token", 401);
        }
    },

    // 5.Refresh token
    refreshToken: async (token: string) => {
        if (!token) throw new AppError("Token is required", 400);
        let decoded: TokenPayload;

        try {
            decoded = jwt.verify(token,
                ENV.JWT_REFRESH_SECRET as string,
                {
                    issuer: ENV.JWT_ISSUER,
                    audience: ENV.JWT_AUDIENCE
                }
            ) as TokenPayload;

        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) throw new AppError("Refresh token expired", 401);
            if (error instanceof jwt.JsonWebTokenError) throw new AppError("Invalid refresh token", 401);
            throw error;
        }

        const storedRefreshToken = await redisClient.get(`refresh_token:${decoded.userID}`);
        if (!storedRefreshToken || storedRefreshToken !== token) throw new AppError("Invalid refresh token", 401);

        const user = await UserModel.findByID(decoded.userID);
        if (!user || !user.User_ID) throw new AppError("User not found", 404);

        const newAccessToken = generateAccessToken({ userID: user.User_ID, role: user.Role });
        return { access_token: newAccessToken };
    },

    // 6.Authorization
    authorize: async (token: string, requiredRole: Role) => {
        const { userID, role } = await AuthService.verifyToken(token);
        const userRole = role as Role;
        if (!roleHierarchy[userRole] || roleHierarchy[userRole] < roleHierarchy[requiredRole]) throw new AppError("Insufficient permissions", 403);

        return { userID, role: userRole };
    },

    // 7.Change password
    changePassword: async (userID: number, oldPassword: string, newPassword: string): Promise<boolean> => {
        if (!oldPassword || !newPassword) throw new AppError("Old password and new password are required", 400);
        if (!validatePassword(newPassword)) throw new AppError("New password must be at least 8 characters long", 400);

        const user = await UserModel.findByID(userID);
        if (!user || !user.Password) throw new AppError("User not found", 404);

        const isMatch = await bcrypt.compare(oldPassword, user.Password as string);
        if (!isMatch) throw new AppError("Old password is incorrect", 401);

        const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        return await UserModel.updateUser(userID, { Password: hashedNewPassword });
    },

    // 8.request OTP
    requestOTP: async (email: string): Promise<void> => {
        if (!validateEmail(email)) throw new AppError("Invalid email format", 400);

        const user = await UserModel.findByEmail(email);
        if (!user) throw new AppError("Email not found", 404);

        await checkRateLimit(`otp_request:${email}`, MAX_OTP_REQUESTS, RATE_LIMIT_TTL_SECONDS);
        const otp = crypto.randomInt(100000, 1000000).toString();
        const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
        await redisClient.setEx(`otp:${email}`, OTP_TTL_SECONDS, hashedOtp);
        await sendEmail(
            email,
            "Your OTP Code",
            `Your OTP code is ${otp}. It will expire in ${OTP_TTL_SECONDS / 60} minutes.`
        );
    },

    // 9.verify OTP
    verifyOTP: async (email: string, otp: string) => {
        if (!validateEmail(email)) throw new AppError("Invalid email format", 400);

        const storedOtp = await redisClient.get(`otp:${email}`);
        if (!storedOtp) throw new AppError("OTP expired or not found", 400);

        const hashedInput = crypto.createHash("sha256").update(otp).digest("hex");
        const a = Buffer.from(hashedInput);
        const b = Buffer.from(storedOtp);
        const isValid = a.length === b.length && crypto.timingSafeEqual(a, b);

        if (!isValid) {
            await checkRateLimit(`otp_attempt:${email}`, MAX_OTP_ATTEMPTS, RATE_LIMIT_TTL_SECONDS);
            throw new AppError("Invalid OTP", 400);
        }

        await redisClient.del(`otp:${email}`);
        await redisClient.del(`otp_attempt:${email}`);

        const user = await UserModel.findByEmail(email);
        if (!user || !user.User_ID) throw new AppError("User not found", 404);

        await UserModel.updateUser(user.User_ID!, { Is_Phone_Verified: true, Verified_Date: new Date() });
        const accessToken = generateAccessToken({ userID: user.User_ID, role: user.Role });
        const refreshToken = generateRefreshToken({ userID: user.User_ID });

        await redisClient.setEx(`refresh_token:${user.User_ID}`, REFRESH_TOKEN_TTL_SECONDS, refreshToken);

        return { access_token: accessToken, refresh_token: refreshToken };
    },

    // 10. Reset Password with OTP
    resetPasswordWithOTP: async (email: string, otp: string, newPassword: string): Promise<void> => {
        if (!validateEmail(email) || !newPassword) throw new AppError("Email and new password are required", 400);
        if (!validatePassword(newPassword)) throw new AppError("New password must be at least 8 characters long", 400);

        const storedOtp = await redisClient.get(`otp:${email}`);
        if (!storedOtp) throw new AppError("OTP expired or not found", 400);

        const hashedInput = crypto.createHash("sha256").update(otp).digest("hex");
        const a = Buffer.from(hashedInput);
        const b = Buffer.from(storedOtp);
        if (!(a.length === b.length && crypto.timingSafeEqual(a, b))) {
            await checkRateLimit(`otp_attempt:${email}`, MAX_OTP_ATTEMPTS, RATE_LIMIT_TTL_SECONDS);
            throw new AppError("Invalid OTP", 400);
        }

        await redisClient.del(`otp:${email}`);
        await redisClient.del(`otp_attempt:${email}`);

        const user = await UserModel.findByEmail(email);
        if (!user || !user.User_ID) throw new AppError("User not found", 404);

        const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await UserModel.updateUser(user.User_ID, { Password: hashedNewPassword });
    },

    // 11. Verify Firebase Phone Auth Token
    verifyFirebasePhone: async (firebaseToken: string) => {
        if (!firebaseToken) throw new AppError("Firebase token is required", 400);

        let decoded;
        try {
            decoded = await firebaseAdmin.auth().verifyIdToken(firebaseToken);
        } catch {
            throw new AppError("Invalid or expired Firebase token", 401);
        }

        const phoneNumber = decoded.phone_number;
        if (!phoneNumber) throw new AppError("No phone number found in Firebase token", 400);

        // แปลงเบอร์จาก +66 เป็น 0 สำหรับค้นหาใน DB
        let localPhone = phoneNumber;
        if (phoneNumber.startsWith("+66")) {
            localPhone = "0" + phoneNumber.substring(3);
        }

        const user = await UserModel.findByPhone(localPhone);
        if (!user || !user.User_ID) throw new AppError("No account found with this phone number. Please register first.", 404);

        await UserModel.updateUser(user.User_ID, { Is_Phone_Verified: true, Verified_Date: new Date() });

        const accessToken = generateAccessToken({ userID: user.User_ID, role: user.Role });
        const refreshToken = generateRefreshToken({ userID: user.User_ID });
        await redisClient.setEx(`refresh_token:${user.User_ID}`, REFRESH_TOKEN_TTL_SECONDS, refreshToken);

        return { access_token: accessToken, refresh_token: refreshToken };
    },
};