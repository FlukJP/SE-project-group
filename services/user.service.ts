import { UserModel } from "@/models/UserModel";
import { User } from "@/types/User";
import redisClient, { connectRedis } from "@/config/redis";
import { AppError } from "@/errors/AppError";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import crypto from "crypto";
import { sendEmail } from '@/lib/utils/emailSender';
import { validateEmail, validatePassword, validatePhoneNumber } from '@/lib/utils/validators';
import { ENV } from "@/config/env";
import { OTP_TTL_SECONDS, RATE_LIMIT_TTL_SECONDS, MAX_OTP_REQUESTS, MAX_OTP_ATTEMPTS, SALT_ROUNDS } from "@/config/constants";

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

// TYPE safe pick
type UpdateUserData = Partial<Pick<User, "Username" | "Phone_number" | "Address">>;

const pickUpdateFields = (data: UpdateUserData): UpdateUserData => {
    const allowedFields: (keyof UpdateUserData)[] = ["Username", "Phone_number", "Address"];
    const pickedData: UpdateUserData = {};
    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            pickedData[field] = data[field];
        };
    };
    return pickedData;
};

export const UserService = {
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

        return await UserModel.createUser(newUser);
    },

    // 2.Login
    login: async (params: { email: string; password: string }) => {
        if (!params.email || !params.password) throw new AppError("Email and Password are required", 400);

        const user = await UserModel.findByEmail(params.email);
        if (!user) throw new AppError("Invalid email or password", 401);

        const isPasswordValid = await bcrypt.compare(params.password, user.Password as string);
        if (!isPasswordValid) throw new AppError("Invalid email or password", 401);

        const token = jwt.sign({ userID: user.User_ID, role: user.Role }, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN, issuer: ENV.JWT_ISSUER, audience: ENV.JWT_AUDIENCE });
        const { Password, ...userWithoutPassword } = user;
        return { token, user: userWithoutPassword };
    },

    // 3.Profile 
    getProfile: async (params: { userID: number }): Promise<Omit<User, "Password">> => {
        const user = await UserModel.findByID(params.userID);
        if (!user) throw new AppError("User not found", 404);
        const { Password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    },

    // 4.Update profile
    updateProfile: async (params: { userID: number, updateData: Partial<User> }): Promise<boolean> => {
        const safeData = pickUpdateFields(params.updateData);

        if (Object.keys(safeData).length === 0) throw new AppError("No valid fields to update", 400);
        if (safeData.Phone_number && !validatePhoneNumber(safeData.Phone_number)) throw new AppError("Phone number must be 10 digits", 400);

        const success = await UserModel.updateUser(params.userID, safeData);
        if (!success) throw new AppError("The data update failed. Please try again.", 500);
        return true;
    },

    // 5.Change password
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

    // 6.request OTP
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
    // 7.verify OTP
    verifyOTP: async (email: string, otp: string): Promise<string> => {
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
        if (!user) throw new AppError("User not found", 404);

        const token = jwt.sign({ userID: user.User_ID, role: user.Role }, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN, issuer: ENV.JWT_ISSUER, audience: ENV.JWT_AUDIENCE });
        return token;
    }
};