import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import type firebaseAdminType from "firebase-admin";
import { User, Role } from "@/src/types/User";
import { UserModel } from "@/src/models/UserModel";
import { AppError } from "@/src/errors/AppError";
import { sendEmailWithRetry } from "@/src/utils/emailSender";
import { validateEmail, validatePassword, validatePhoneNumber, validateUsername } from "@/src/utils/validators";
import redisClient from "@/src/config/redis";
import { OTP_TTL_SECONDS, RATE_LIMIT_TTL_SECONDS, MAX_OTP_REQUESTS, MAX_OTP_ATTEMPTS, SALT_ROUNDS } from "@/src/config/constants";
import { REFRESH_TOKEN_TTL_SECONDS } from "@/src/config/constants";
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, TokenPayload } from "@/src/utils/jwt";

// HELPERS

/** Increment a Redis counter and throw a rate-limit error if the limit is exceeded within the TTL window */
const checkRateLimit = async (key: string, limit: number, ttlSeconds: number): Promise<void> => {
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
    admin: 2,
};

// EMAIL TEMPLATES

const otpEmailTemplate = (otp: string, expiryMinutes: number, purpose = "verification") => ({
    subject: `Your OTP Code — ${otp}`,
    text: `Your OTP code is ${otp}. It will expire in ${expiryMinutes} minutes. Do not share this code with anyone.`,
    html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="margin-bottom:8px">Your OTP Code</h2>
            <p style="color:#555">Use the code below for ${purpose}:</p>
            <div style="font-size:36px;font-weight:bold;letter-spacing:8px;padding:16px 0;color:#111">
                ${otp}
            </div>
            <p style="color:#888;font-size:13px">
                This code will expire in <strong>${expiryMinutes} minutes</strong>.<br/>
                Do not share this code with anyone.
            </p>
        </div>
    `,
});

// OTP CORE
// store OTP atomically with NX to prevent race conditions

/**
 * Generate, hash, and store OTP atomically.
 * Uses SET NX (only if not exists) to prevent race condition
 * where two simultaneous requests both pass the existence check.
 * Returns the plain OTP for sending, or throws if one already exists.
 */
const generateAndStoreOTP = async (redisKey: string): Promise<string> => {
    const otp = crypto.randomInt(100_000, 1_000_000).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // NX = only set if key does not exist (atomic)
    const wasSet = await redisClient.set(redisKey, hashedOtp, { NX: true, EX: OTP_TTL_SECONDS });
    if (!wasSet) throw new AppError("OTP already sent. Please wait until it expires.", 429);

    return otp;
};

/** Timing-safe OTP comparison */
const verifyOTPHash = (input: string, stored: string): boolean => {
    const hashedInput = crypto.createHash("sha256").update(input).digest("hex");
    const a = Buffer.from(hashedInput);
    const b = Buffer.from(stored);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// AUTH SERVICE

export const AuthService = {
    /** Validate input, hash the password, create a new user, and send a verification OTP email */
    register: async (userData: User): Promise<number> => {
        if (!userData.Username || !userData.Email || !userData.Password || !userData.Phone_number) {
            throw new AppError("Username, Email, Password and Phone number are required", 400);
        }
        if (!validateUsername(userData.Username)) throw new AppError("Username must be 2-50 characters and contain only letters, numbers, spaces, underscores, or hyphens", 400);
        if (!validateEmail(userData.Email)) throw new AppError("Invalid email format", 400);
        if (!validatePassword(userData.Password)) throw new AppError("Password must be at least 8 characters and include uppercase, lowercase, number, and special character", 400);
        if (!validatePhoneNumber(userData.Phone_number)) throw new AppError("Phone number must be 10 digits", 400);

        const existingUser = await UserModel.findByEmailSafe(userData.Email);
        if (existingUser) throw new AppError("Email already in use", 409);

        const existingPhone = await UserModel.findByPhone(userData.Phone_number);
        if (existingPhone) throw new AppError("Phone number already in use", 409);

        const newUser: User = {
            ...userData,
            Password: await bcrypt.hash(userData.Password, SALT_ROUNDS),
            Role: "customer",
        };

        const insertId = await UserModel.createUser(newUser);

        // Send verification OTP immediately after account creation
        // ไม่ throw ถ้า email ล้มเหลว — user ยังสมัครสำเร็จ แค่ขอ OTP ใหม่ได้ทีหลัง
        try {
            await AuthService.requestOTP(userData.Email);
        } catch (error) {
            console.error(`[Auth] Failed to send verification OTP after register for ${userData.Email}:`, error);
        }

        return insertId;
    },

    /** Verify credentials, enforce brute-force protection, and return access + refresh tokens */
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

        await redisClient.del(`login_attempts:${params.email}`);

        const accessToken = generateAccessToken({ userID: user.User_ID, role: user.Role });
        const refreshToken = generateRefreshToken({ userID: user.User_ID });
        await redisClient.setEx(`refresh_token:${user.User_ID}`, REFRESH_TOKEN_TTL_SECONDS, refreshToken);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { Password, ...userWithoutPassword } = user;
        return { access_token: accessToken, refresh_token: refreshToken, user: userWithoutPassword };
    },

    /** Blacklist the access token and remove the stored refresh token from Redis */
    logout: async (token: string): Promise<void> => {
        if (!token) throw new AppError("Token is required", 400);
        let decoded: TokenPayload;
        try {
            decoded = verifyAccessToken(token, { ignoreExpiration: true });
        } catch {
            throw new AppError("Invalid token signature", 400);
        }

        if (!decoded?.exp || !decoded?.userID) throw new AppError("Invalid token payload", 400);
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) await redisClient.setEx(`blacklist:${token}`, ttl, "blacklisted");
        await redisClient.del(`refresh_token:${decoded.userID}`);
    },

    /** Check the token against the blacklist and verify its signature, returning the user ID and role */
    verifyToken: async (token: string): Promise<{ userID: number; role: string }> => {
        if (!token) throw new AppError("Token is required", 400);
        const isBlacklisted = await redisClient.get(`blacklist:${token}`);
        if (isBlacklisted) throw new AppError("Token has been revoked", 401);
        try {
            const decoded = verifyAccessToken(token);
            return { userID: decoded.userID, role: decoded.role };
        } catch {
            throw new AppError("Invalid or expired token", 401);
        }
    },

    /** Verify the refresh token against the stored value in Redis and issue a new access token */
    refreshToken: async (token: string) => {
        if (!token) throw new AppError("Token is required", 400);
        let decoded: TokenPayload;
        try {
            decoded = verifyRefreshToken(token);
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) throw new AppError("Refresh token expired", 401);
            if (error instanceof jwt.JsonWebTokenError) throw new AppError("Invalid refresh token", 401);
            throw error;
        }

        const storedRefreshToken = await redisClient.get(`refresh_token:${decoded.userID}`);
        if (!storedRefreshToken || storedRefreshToken !== token) throw new AppError("Invalid refresh token", 401);

        const user = await UserModel.findByIDSafe(decoded.userID);
        if (!user || !user.User_ID) throw new AppError("User not found", 404);

        const newAccessToken = generateAccessToken({ userID: user.User_ID, role: user.Role });
        return { access_token: newAccessToken };
    },

    /** Verify the token and ensure the user's role meets or exceeds the required role level */
    authorize: async (token: string, requiredRole: Role) => {
        const { userID, role } = await AuthService.verifyToken(token);
        const userRole = role as Role;
        if (!roleHierarchy[userRole] || roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
            throw new AppError("Insufficient permissions", 403);
        }
        return { userID, role: userRole };
    },

    /** Verify the old password and update it with the new hashed password */
    changePassword: async (userID: number, oldPassword: string, newPassword: string): Promise<boolean> => {
        if (!oldPassword || !newPassword) throw new AppError("Old password and new password are required", 400);
        if (!validatePassword(newPassword)) throw new AppError("New password must be at least 8 characters and include uppercase, lowercase, number, and special character", 400);

        const user = await UserModel.findByID(userID);
        if (!user || !user.Password) throw new AppError("User not found", 404);

        const isMatch = await bcrypt.compare(oldPassword, user.Password as string);
        if (!isMatch) throw new AppError("Old password is incorrect", 401);

        const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        return await UserModel.updateUser(userID, { Password: hashedNewPassword });
    },

    /** Generate a 6-digit OTP, hash and store it in Redis atomically, then send it to the user's email */
    requestOTP: async (email: string): Promise<void> => {
        email = email.toLowerCase().trim();
        if (!validateEmail(email)) throw new AppError("Invalid email format", 400);

        const user = await UserModel.findByEmailSafe(email);
        if (!user) throw new AppError("Email not found", 404);

        await checkRateLimit(`otp_request:${email}`, MAX_OTP_REQUESTS, RATE_LIMIT_TTL_SECONDS);

        // Cooldown check (60s between requests)
        const cooldownKey = `otp_cooldown:${email}`;
        const cooldown = await redisClient.get(cooldownKey);
        if (cooldown) throw new AppError("Please wait before requesting another OTP.", 429);

        // Atomic NX set — prevents race condition where two requests both pass existence check
        const otp = await generateAndStoreOTP(`otp:${email}`);

        // Set cooldown before sending — prevents double-send on slow network
        await redisClient.setEx(cooldownKey, 60, "1");

        const expiryMinutes = OTP_TTL_SECONDS / 60;

        try {
            console.log(`[OTP] Sending OTP to ${email}`);
            await sendEmailWithRetry({
                to: email,
                ...otpEmailTemplate(otp, expiryMinutes, "email verification"),
            });
            console.log(`[OTP] ✅ OTP sent to ${email}`);
        } catch (error) {
            // Clean up both OTP and cooldown so user can retry immediately
            await redisClient.del(`otp:${email}`, cooldownKey);
            console.error(`[OTP] ❌ Failed to send OTP to ${email}:`, error);
            throw new AppError("OTP email service is unavailable. Please try again later.", 503);
        }
    },

    /** Verify the provided OTP using a timing-safe comparison, mark the email as verified, and return new tokens */
    verifyOTP: async (email: string, otp: string) => {
        email = email.toLowerCase().trim();
        if (!validateEmail(email)) throw new AppError("Invalid email format", 400);

        // Check attempt limit before touching stored OTP
        await checkRateLimit(`otp_attempt:${email}`, MAX_OTP_ATTEMPTS, RATE_LIMIT_TTL_SECONDS);

        const storedOtp = await redisClient.get(`otp:${email}`);
        if (!storedOtp) throw new AppError("OTP expired or not found", 400);

        const cleanOtp = otp.trim();
        if (!/^\d{6}$/.test(cleanOtp)) throw new AppError("Invalid OTP format", 400);

        const isValid = verifyOTPHash(cleanOtp, storedOtp);
        if (!isValid) {
            console.warn(`[OTP] Invalid OTP attempt for ${email}`);
            throw new AppError("Invalid OTP", 400);
        }

        await redisClient.del(`otp:${email}`, `otp_attempt:${email}`, `otp_cooldown:${email}`);

        const user = await UserModel.findByEmailSafe(email);
        if (!user || !user.User_ID) throw new AppError("User not found", 404);

        await UserModel.updateUser(user.User_ID, { Is_Email_Verified: true, Verified_Date: new Date() });

        const accessToken = generateAccessToken({ userID: user.User_ID, role: user.Role });
        const refreshToken = generateRefreshToken({ userID: user.User_ID });
        await redisClient.setEx(`refresh_token:${user.User_ID}`, REFRESH_TOKEN_TTL_SECONDS, refreshToken);

        return { access_token: accessToken, refresh_token: refreshToken };
    },

    /** Verify the OTP and update the user's password to the new hashed value */
    resetPasswordWithOTP: async (email: string, otp: string, newPassword: string): Promise<void> => {
        // Normalize เพื่อให้ key ตรงกับที่ requestOTP เก็บไว้
        email = email.toLowerCase().trim();
        if (!validateEmail(email)) throw new AppError("Invalid email format", 400);
        if (!newPassword) throw new AppError("New password is required", 400);
        if (!validatePassword(newPassword)) throw new AppError("New password must be at least 8 characters and include uppercase, lowercase, number, and special character", 400);

        // Check attempt limit before touching stored OTP
        await checkRateLimit(`otp_attempt:${email}`, MAX_OTP_ATTEMPTS, RATE_LIMIT_TTL_SECONDS);

        const storedOtp = await redisClient.get(`otp:${email}`);
        if (!storedOtp) throw new AppError("OTP expired or not found", 400);

        const isValid = verifyOTPHash(otp.trim(), storedOtp);
        if (!isValid) throw new AppError("Invalid OTP", 400);

        await redisClient.del(`otp:${email}`, `otp_attempt:${email}`, `otp_cooldown:${email}`);

        const user = await UserModel.findByEmailSafe(email);
        if (!user || !user.User_ID) throw new AppError("User not found", 404);

        const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await UserModel.updateUser(user.User_ID, { Password: hashedNewPassword });
    },

    /** Generate a phone OTP and send it to the user's registered email address */
    requestPhoneOTP: async (phone: string): Promise<void> => {
        if (!validatePhoneNumber(phone)) throw new AppError("Phone number must be 10 digits", 400);

        const user = await UserModel.findByPhone(phone);
        if (!user) throw new AppError("No account found for this phone number", 404);
        if (!user.Is_Email_Verified) throw new AppError("Please verify your email before verifying phone number", 400);

        await checkRateLimit(`otp_request:phone:${phone}`, MAX_OTP_REQUESTS, RATE_LIMIT_TTL_SECONDS);

        const cooldownKey = `otp_cooldown:phone:${phone}`;
        const cooldown = await redisClient.get(cooldownKey);
        if (cooldown) throw new AppError("Please wait before requesting another OTP.", 429);

        // Atomic NX set
        const otp = await generateAndStoreOTP(`otp:phone:${phone}`);
        await redisClient.setEx(cooldownKey, 60, "1");

        const expiryMinutes = OTP_TTL_SECONDS / 60;

        try {
            await sendEmailWithRetry({
                to: user.Email,
                subject: `Phone Verification OTP`,
                text: `Your OTP to verify phone number ${phone} is ${otp}. This code will expire in ${expiryMinutes} minutes.`,
                html: `
                    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
                        <h2>Phone Verification</h2>
                        <p style="color:#555">Use the code below to verify phone number <strong>${phone}</strong>:</p>
                        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;padding:16px 0;color:#111">
                            ${otp}
                        </div>
                        <p style="color:#888;font-size:13px">
                            Expires in <strong>${expiryMinutes} minutes</strong>.<br/>
                            Note: This OTP was sent via email because SMS is not yet available.
                        </p>
                    </div>
                `,
            });
        } catch (error) {
            await redisClient.del(`otp:phone:${phone}`, cooldownKey);
            console.error(`[OTP] Failed to send phone OTP for ${phone}:`, error);
            throw new AppError("OTP email service is unavailable. Please try again later.", 503);
        }
    },

    /** Verify the phone OTP, mark the phone as verified, and return new tokens */
    verifyPhoneOTP: async (phone: string, otp: string) => {
        if (!validatePhoneNumber(phone)) throw new AppError("Invalid phone number", 400);

        await checkRateLimit(`otp_attempt:phone:${phone}`, MAX_OTP_ATTEMPTS, RATE_LIMIT_TTL_SECONDS);

        const storedOtp = await redisClient.get(`otp:phone:${phone}`);
        if (!storedOtp) throw new AppError("OTP expired or not found", 400);

        const isValid = verifyOTPHash(otp.trim(), storedOtp);
        if (!isValid) throw new AppError("Invalid OTP", 400);

        await redisClient.del(`otp:phone:${phone}`, `otp_attempt:phone:${phone}`, `otp_cooldown:phone:${phone}`);

        const user = await UserModel.findByPhone(phone);
        if (!user || !user.User_ID) throw new AppError("User not found", 404);

        await UserModel.updateUser(user.User_ID, { Is_Phone_Verified: true, Verified_Date: new Date() });

        const accessToken = generateAccessToken({ userID: user.User_ID, role: user.Role });
        const refreshToken = generateRefreshToken({ userID: user.User_ID });
        await redisClient.setEx(`refresh_token:${user.User_ID}`, REFRESH_TOKEN_TTL_SECONDS, refreshToken);

        return { access_token: accessToken, refresh_token: refreshToken };
    },

    /** Verify a Firebase ID token, resolve the phone number to a local user, mark the phone as verified, and return new tokens */
    verifyPhoneFirebase: async (idToken: string) => {
        if (!idToken) throw new AppError("Firebase ID token is required", 400);

        let firebasePhone: string | undefined;
        try {
            const firebaseAdmin = (await import("../config/firebaseAdmin.js"))
                .default as unknown as typeof firebaseAdminType;
            const decoded = await firebaseAdmin.auth().verifyIdToken(idToken);
            firebasePhone = decoded.phone_number;
        } catch {
            throw new AppError("Invalid Firebase ID token", 401);
        }

        if (!firebasePhone) throw new AppError("Phone number not found in token", 400);

        // Convert E.164 (+66xxxxxxxxx) → Thai local format (0xxxxxxxxx)
        const phone = firebasePhone.startsWith("+66")
            ? "0" + firebasePhone.slice(3)
            : firebasePhone;

        const user = await UserModel.findByPhone(phone);
        if (!user || !user.User_ID) throw new AppError("No account found for this phone number", 404);
        if (!user.Is_Email_Verified) throw new AppError("Please verify your email before verifying phone number", 400);

        await UserModel.updateUser(user.User_ID, { Is_Phone_Verified: true, Verified_Date: new Date() });

        const accessToken = generateAccessToken({ userID: user.User_ID, role: user.Role });
        const refreshToken = generateRefreshToken({ userID: user.User_ID });
        await redisClient.setEx(`refresh_token:${user.User_ID}`, REFRESH_TOKEN_TTL_SECONDS, refreshToken);

        return { access_token: accessToken, refresh_token: refreshToken };
    },
};
