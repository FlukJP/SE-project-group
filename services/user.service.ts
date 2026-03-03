import { UserModel } from "@/models/UserModel";
import { User } from "@/types/User";
import redisClient,{ connectRedis } from "@/config/redis";
import { AppError } from "@/errors/AppError";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import crypto from "crypto";

// Env guard
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET){
    throw new Error("JWT_SECRET is not defined in environment variables");
};

const JWT_ISSUER = process.env.JWT_ISSUER;
if (!JWT_ISSUER){
    throw new Error("JWT_ISSUER is not defined in environment variables");
};

const JWT_AUDIENCE = process.env.JWT_AUDIENCE;
if (!JWT_AUDIENCE){
    throw new Error("JWT_AUDIENCE is not defined in environment variables");
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
if (!JWT_EXPIRES_IN){
    throw new Error("JWT_EXPIRES_IN is not defined in environment variables");
}

// config
const OTP_TTL_SECONDS = 5 * 60;
const RATE_LIMIT_TTL_SECONDS = 15 * 60;
const MAX_OTP_REQUESTS = 5;
const MAX_OTP_ATTEMPTS = 5;
const SALT_ROUNDS = 10;

// ตรวจสอบ input (Validators)
const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
    return password.length >= 8;
};

const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
};

// Redis (rate limiters)
const checkRateLimit = async (key: string, limit: number, ttlSeconds: number): Promise<void> => {
    await connectRedis();
    const count = await redisClient.multi().incr(key).expire(key, ttlSeconds).exec();
    const countValue = (count[0] as any)[1] as number;

    if (countValue > limit) {
        const ttl = await redisClient.ttl(key);
        const minutes = Math.ceil(ttl/60);
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
        if (!userData.Email || !userData.Password || !userData.Phone_number) {
            throw new AppError("Email, Password and Phone number are required", 400);
        };

        if (!validateEmail(userData.Email)) {
            throw new AppError("Invalid email format", 400);
        }

        if (!validatePassword(userData.Password)) { 
            throw new AppError("Password must be at least 8 characters long", 400);
        }

        if (!validatePhoneNumber(userData.Phone_number)) {
            throw new AppError("Phone number must be 10 digits", 400);
        }

        const existingUser = await UserModel.findByEmail(userData.Email);
        if (existingUser) {
            throw new AppError("Email already in use", 409);
        }

        const newUser: User = {
            ...userData,
            Password: await bcrypt.hash(userData.Password, SALT_ROUNDS),
            Role: 'customer',
        }

        return await UserModel.createUser(newUser);
    },

    // 2.Login
    login: async (params: { email: string; password: string }) => {
        if (!params.email || !params.password){
            throw new AppError("Email and Password are required", 400);
        }

        const user = await UserModel.findByEmail(params.email);
        if (!user) {
            throw new AppError("Invalid email or password", 401);
        }

        const isPasswordValid = await bcrypt.compare(params.password, user.Password as string);
        if(!isPasswordValid) {
            throw new AppError("Invalid email or password", 401);
        }

        const token = jwt.sign({userID: user.User_ID,role: user.Role},JWT_SECRET,{expiresIn: NumberJWT_EXPIRES_IN,issuer: JWT_ISSUER,audience: JWT_AUDIENCE});
        const {Password, ...userWithoutPassword} = user;
        return { token, user: userWithoutPassword };
    },

    // 3.Profile 
    getprofile: async (params:{userID: number}): Promise<Omit<User, "Password">> => {
        const user = await UserModel.findByID(params.userID);
        if(!user) {
            throw new AppError("User not found", 404);
        }
        
        const {Password, ...userWithoutPassword} = user;
        return userWithoutPassword;
    },

    // 4.Update profile
    updateprofile: async (params:{userID: number, updateData: Partial<User>}): Promise<boolean>=> {
        const safeData = pickUpdateFields(params.updateData);

        if (safeData.Phone_number && !validatePhoneNumber(safeData.Phone_number)) {
            throw new AppError("Phone number must be 10 digits", 400);
        }

        if (Object.keys(safeData).length === 0) {
            throw new AppError("No valid fields to update", 400);
        }

        const success = await UserModel.updateUser(params.userID, safeData);
        if (!success) {
            throw new AppError("The data update failed. Please try again.", 500);
        }

        return true;
    },

    // 5.Change password
    changepassword: async (userID: number,oldPassword: string, newPassword: string): Promise<boolean> => {
        if (!oldPassword||!newPassword) {
            throw new AppError("Old password and new password are required", 400);
        }

        if (!validatePassword(newPassword)) {
            throw new AppError("New password must be at least 8 characters long", 400);
        }

        const user = await UserModel.findByID(userID);
        if (!user || !user.Password) {
            throw new AppError("User not found", 404);
        }

        const isMatch = await bcrypt.compare(oldPassword, user.Password as string);
        if (!isMatch) {
            throw new AppError("Old password is incorrect", 401);
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        return await UserModel.updateUser(userID, { Password: hashedNewPassword });
    },

    // 6.request OTP
    // 7.verify OTP
};