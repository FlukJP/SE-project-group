import { UserModel } from "@/models/UserModel";
import { User } from "@/types/User";
import redisClient,{ connectRedis } from "@/config/redis";
import { AppError } from "@/errors/AppError";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import crypto, { verify } from "crypto";

// Env guard
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET){
    throw new Error("JWT_SECRET is not defined in environment variables");
};

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
    return password.length >= 8; // อย่างน้อย 6 ตัวอักษร
};

const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
};

// Redis (rate limiters)
const checkRateLimit = async (key: string, limit: number, ttlSeconds: number): Promise<void> => {
    await connectRedis();
    const count = await redisClient.incr(key);
    if (count === 1) {
        await redisClient.expire(key, ttlSeconds);
    }

    if (count > limit) {
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
            Role: userData.Role,
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

        const token = jwt.sign({userID: user.User_ID,role: user.Role},JWT_SECRET,{expiresIn: "1h",issuer: "your-app",audience: "your-users"});
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
    requestOTP: async (phone: string): Promise<boolean> => {
        if(!phone){
            throw new AppError("Phone number is required", 400);
        }

        if (!validatePhoneNumber(phone)) {
            throw new AppError("Phone number must be 10 digits", 400);
        }

        const existingUser = await UserModel.findByPhone(phone);
        if (!existingUser) {
            throw new AppError("Phone number not found", 404);
        }

        await connectRedis();
        await checkRateLimit(`otp_request:${phone}`, MAX_OTP_REQUESTS, RATE_LIMIT_TTL_SECONDS);

        const otpcode = crypto.randomInt(100000, 1000000).toString();
        const hashedotp = await bcrypt.hash(otpcode, 5);
        await redisClient.setEx(`otp:${phone}`, OTP_TTL_SECONDS, hashedotp);
        
        console.log("\n================================");
        console.log(`📱 [MOCK SMS] ส่งไปที่: ${phone}`);
        console.log(`OTP: ${otpcode} (หมดอายุ 5 นาที)`);
        console.log("================================\n");

        return true;
    },

    // 7.verify OTP
    verifyOTP: async (phone: string, otp: string) => {
        if (!phone || !otp) {
            throw new AppError("Phone number and OTP are required", 400);
        }

        if (!validatePhoneNumber(phone)) {
            throw new AppError("Phone number must be 10 digits", 400);
        }

        await connectRedis();
        const failKey = `otp_fail:${phone}`;
        const currentFails = await redisClient.get(failKey);
        if (currentFails && parseInt(currentFails) >= MAX_OTP_ATTEMPTS) {
            const ttl = await redisClient.ttl(failKey);
            const minutes = Math.ceil(ttl/60);
            throw new AppError(`Too many failed attempts. Please try again in ${minutes} minute(s).`, 429);
        }

        const storedHashedOTP = await redisClient.get(`otp:${phone}`);
        if (!storedHashedOTP) {
            throw new AppError("OTP expired or not found", 404);
        }

        const isValid = await bcrypt.compare(otp, storedHashedOTP);
        if (!isValid) {
            const newFailCount = await redisClient.incr(failKey);
            if (newFailCount === 1) {
                await redisClient.expire(failKey, RATE_LIMIT_TTL_SECONDS);
            }
            throw new AppError("Invalid OTP", 401);
        }

        await redisClient.del(`otp:${phone}`);
        await redisClient.del(failKey);
        
        const user = await UserModel.findByPhone(phone);
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const token = jwt.sign({userID: user.User_ID, role: user.Role}, JWT_SECRET, {expiresIn: "1h", issuer: "your-app", audience: "your-users"});
        const {Password, ...userWithoutPassword} = user;
        return { message: "OTP verified successfully", token: token, user: userWithoutPassword };
    }
};