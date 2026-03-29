import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '@/src/services/auth.service';
import { UserModel } from '@/src/models/UserModel';
import { AppError } from '@/src/errors/AppError';
import { generateAccessToken, generateRefreshToken } from '@/src/utils/jwt';
import redisClient from '@/src/config/redis';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// Mock all external dependencies
vi.mock('@/src/models/UserModel');
vi.mock('@/src/config/redis', () => {
    const store = new Map<string, string>();
    const adapter = {
        get: vi.fn(async (key: string) => store.get(key) ?? null),
        setEx: vi.fn(async (key: string, _ttl: number, value: string) => { store.set(key, value); }),
        incr: vi.fn(async (key: string) => {
            const cur = Number(store.get(key) || '0') + 1;
            store.set(key, String(cur));
            return cur;
        }),
        expire: vi.fn(async () => {}),
        ttl: vi.fn(async () => 900),
        del: vi.fn(async (key: string) => { store.delete(key); }),
    };
    return {
        default: adapter,
        connectRedis: vi.fn(async () => {}),
        disconnectRedis: vi.fn(async () => {}),
        isRedisAvailable: vi.fn(() => true),
    };
});
vi.mock('@/src/utils/emailSender', () => ({ sendEmail: vi.fn(async () => {}) }));
vi.mock('@/src/config/env', () => ({
    ENV: {
        JWT_SECRET: 'test-secret-key-that-is-long-enough',
        JWT_ISSUER: 'test-issuer',
        JWT_AUDIENCE: 'test-audience',
        JWT_EXPIRES_IN: 3600,
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
        PRODUCT_MAX_SIZE: 5, 
        USER_MAX_SIZE: 2,
    },
}));

describe('AuthService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ===== register =====
    describe('register', () => {
        it('should throw when required fields are missing', async () => {
            await expect(
                AuthService.register({ Username: '', Email: 'a@b.com', Password: '12345678', Phone_number: '0812345678', Role: 'customer' })
            ).rejects.toThrow(AppError);
        });

        it('should throw on invalid email format', async () => {
            await expect(
                AuthService.register({ Username: 'Test User', Email: 'invalid', Password: '12345678', Phone_number: '0812345678', Role: 'customer' })
            ).rejects.toThrow('Invalid email format');
        });

        it('should throw when password is too short', async () => {
            await expect(
                AuthService.register({ Username: 'Test User', Email: 'test@email.com', Password: '1234', Phone_number: '0812345678', Role: 'customer' })
            ).rejects.toThrow('Password must be at least 8 characters and include uppercase, lowercase, number, and special character');
        });

        it('should throw on invalid phone number', async () => {
            await expect(
                AuthService.register({ Username: 'Test User', Email: 'test@email.com', Password: 'Password1!', Phone_number: '123', Role: 'customer' })
            ).rejects.toThrow('Phone number must be 10 digits');
        });

        it('should throw when email is already in use', async () => {
            vi.mocked(UserModel.findByEmailSafe).mockResolvedValue({
                User_ID: 1, Username: 'Existing', Email: 'test@email.com', Role: 'customer',
                Is_Banned: false, Is_Email_Verified: false, Is_Phone_Verified: false,
            });

            await expect(
                AuthService.register({ Username: 'New User', Email: 'test@email.com', Password: 'Password1!', Phone_number: '0812345678', Role: 'customer' })
            ).rejects.toThrow('Email already in use');
        });

        it('should throw when phone is already in use', async () => {
            vi.mocked(UserModel.findByEmailSafe).mockResolvedValue(null);
            vi.mocked(UserModel.findByPhone).mockResolvedValue({
                User_ID: 2, Username: 'Existing', Email: 'other@email.com', Role: 'customer',
            });

            await expect(
                AuthService.register({ Username: 'New User', Email: 'new@email.com', Password: 'Password1!', Phone_number: '0812345678', Role: 'customer' })
            ).rejects.toThrow('Phone number already in use');
        });

        it('should register successfully and return insertId', async () => {
            vi.mocked(UserModel.findByEmailSafe).mockResolvedValue(null);
            vi.mocked(UserModel.findByPhone).mockResolvedValue(null);
            vi.mocked(UserModel.createUser).mockResolvedValue(42);

            const result = await AuthService.register({
                Username: 'New User',
                Email: 'new@email.com',
                Password: 'Password1!',
                Phone_number: '0812345678',
                Role: 'customer',
            });

            expect(result).toBe(42);
            expect(UserModel.createUser).toHaveBeenCalledTimes(1);
        });
    });

    // ===== login =====
    describe('login', () => {
        it('should throw when email or password missing', async () => {
            await expect(AuthService.login({ email: '', password: '12345678' })).rejects.toThrow('Email and Password are required');
            await expect(AuthService.login({ email: 'a@b.com', password: '' })).rejects.toThrow('Email and Password are required');
        });

        it('should throw on invalid credentials (no user)', async () => {
            vi.mocked(UserModel.findByEmail).mockResolvedValue(null);

            await expect(AuthService.login({ email: 'no@user.com', password: '12345678' })).rejects.toThrow('Invalid email or password');
        });
    });

    // ===== changePassword =====
    describe('changePassword', () => {
        it('should throw when old or new password is missing', async () => {
            await expect(AuthService.changePassword(1, '', 'newpass123')).rejects.toThrow('Old password and new password are required');
            await expect(AuthService.changePassword(1, 'oldpass', '')).rejects.toThrow('Old password and new password are required');
        });

        it('should throw when new password is too short', async () => {
            await expect(AuthService.changePassword(1, 'oldpass12', 'short')).rejects.toThrow('New password must be at least 8 characters and include uppercase, lowercase, number, and special character');
        });

        it('should throw when user not found', async () => {
            vi.mocked(UserModel.findByID).mockResolvedValue(null);

            await expect(AuthService.changePassword(999, 'oldpass12', 'Newpass12!')).rejects.toThrow('User not found');
        });

        it('should throw when old password is incorrect', async () => {
            const hashed = await bcrypt.hash('correctpassword', 1);
            vi.mocked(UserModel.findByID).mockResolvedValue({
                User_ID: 1, Username: 'Test', Email: 'test@email.com',
                Password: hashed, Role: 'customer', Is_Banned: false,
                Is_Email_Verified: false, Is_Phone_Verified: false,
            });

            await expect(AuthService.changePassword(1, 'wrongpassword', 'Newpassword123!')).rejects.toThrow('Old password is incorrect');
        });

        it('should update password successfully', async () => {
            const hashed = await bcrypt.hash('correctpassword', 1);
            vi.mocked(UserModel.findByID).mockResolvedValue({
                User_ID: 1, Username: 'Test', Email: 'test@email.com',
                Password: hashed, Role: 'customer', Is_Banned: false,
                Is_Email_Verified: false, Is_Phone_Verified: false,
            });
            vi.mocked(UserModel.updateUser).mockResolvedValue(true);

            const result = await AuthService.changePassword(1, 'correctpassword', 'Newpassword123!');
            expect(result).toBe(true);
        });
    });

    // ===== requestOTP =====
    describe('requestOTP', () => {
        it('should throw on invalid email', async () => {
            await expect(AuthService.requestOTP('invalid')).rejects.toThrow('Invalid email format');
        });

        it('should throw when email not found', async () => {
            vi.mocked(UserModel.findByEmailSafe).mockResolvedValue(null);

            await expect(AuthService.requestOTP('nouser@email.com')).rejects.toThrow('Email not found');
        });
    });

    // ===== verifyOTP =====
    describe('verifyOTP', () => {
        it('should throw on invalid email', async () => {
            await expect(AuthService.verifyOTP('bad', '123456')).rejects.toThrow('Invalid email format');
        });

        it('should throw when OTP is not found in store', async () => {
            await expect(AuthService.verifyOTP('nootp@email.com', '123456')).rejects.toThrow('OTP expired or not found');
        });

        it('should throw on invalid OTP when stored OTP does not match', async () => {
            const hashedOtp = crypto.createHash('sha256').update('999999').digest('hex');
            await redisClient.setEx('otp:wrongotp@email.com', 300, hashedOtp);

            await expect(AuthService.verifyOTP('wrongotp@email.com', '000000')).rejects.toThrow('Invalid OTP');
        });

        it('should verify OTP successfully and return tokens', async () => {
            const otp = '654321';
            const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
            await redisClient.setEx('otp:verifyok@email.com', 300, hashedOtp);
            vi.mocked(UserModel.findByEmailSafe).mockResolvedValue({
                User_ID: 10, Username: 'Verify', Email: 'verifyok@email.com',
                Role: 'customer', Is_Banned: false, Is_Email_Verified: false, Is_Phone_Verified: false,
            });
            vi.mocked(UserModel.updateUser).mockResolvedValue(true);

            const result = await AuthService.verifyOTP('verifyok@email.com', otp);
            expect(result).toHaveProperty('access_token');
            expect(result).toHaveProperty('refresh_token');
        });
    });

    // ===== requestPhoneOTP =====
    describe('requestPhoneOTP', () => {
        it('should throw on invalid phone number', async () => {
            await expect(AuthService.requestPhoneOTP('123')).rejects.toThrow('Phone number must be 10 digits');
        });

        it('should throw when phone not found', async () => {
            vi.mocked(UserModel.findByPhone).mockResolvedValue(null);

            await expect(AuthService.requestPhoneOTP('0812345678')).rejects.toThrow('No account found for this phone number');
        });

        it('should throw when email is not verified', async () => {
            vi.mocked(UserModel.findByPhone).mockResolvedValue({
                User_ID: 2, Username: 'NotVerified', Email: 'notverified@email.com',
                Role: 'customer', Is_Email_Verified: false, Is_Phone_Verified: false, Is_Banned: false,
            });

            await expect(AuthService.requestPhoneOTP('0899999999')).rejects.toThrow('Please verify your email before verifying phone number');
        });
    });

    // ===== logout =====
    describe('logout', () => {
        it('should throw when token is missing', async () => {
            await expect(AuthService.logout('')).rejects.toThrow('Token is required');
        });

        it('should throw on invalid token signature', async () => {
            await expect(AuthService.logout('not.a.valid.token')).rejects.toThrow('Invalid token signature');
        });

        it('should succeed with a valid token', async () => {
            const token = generateAccessToken({ userID: 1, role: 'customer' });
            await expect(AuthService.logout(token)).resolves.toBeUndefined();
        });
    });

    // ===== verifyToken =====
    describe('verifyToken', () => {
        it('should throw when token is missing', async () => {
            await expect(AuthService.verifyToken('')).rejects.toThrow('Token is required');
        });

        it('should throw on invalid or expired token', async () => {
            await expect(AuthService.verifyToken('bad.token.value')).rejects.toThrow('Invalid or expired token');
        });

        it('should return userID and role for a valid token', async () => {
            const token = generateAccessToken({ userID: 7, role: 'admin' });
            const result = await AuthService.verifyToken(token);
            expect(result.userID).toBe(7);
            expect(result.role).toBe('admin');
        });
    });

    // ===== refreshToken =====
    describe('refreshToken', () => {
        it('should throw when token is missing', async () => {
            await expect(AuthService.refreshToken('')).rejects.toThrow('Token is required');
        });

        it('should throw when refresh token is not stored in redis', async () => {
            const token = generateRefreshToken({ userID: 999 });
            await expect(AuthService.refreshToken(token)).rejects.toThrow('Invalid refresh token');
        });

        it('should return new access token when refresh token is valid', async () => {
            const token = generateRefreshToken({ userID: 8 });
            await redisClient.setEx('refresh_token:8', 86400, token);
            vi.mocked(UserModel.findByIDSafe).mockResolvedValue({
                User_ID: 8, Username: 'RefreshUser', Email: 'refresh@email.com',
                Role: 'customer', Is_Banned: false, Is_Email_Verified: true, Is_Phone_Verified: false,
            });

            const result = await AuthService.refreshToken(token);
            expect(result).toHaveProperty('access_token');
        });
    });

    // ===== authorize =====
    describe('authorize', () => {
        it('should throw 403 when user role is insufficient', async () => {
            const token = generateAccessToken({ userID: 100, role: 'customer' });
            await expect(AuthService.authorize(token, 'admin')).rejects.toThrow('Insufficient permissions');
        });

        it('should return userID and role when role is sufficient', async () => {
            const token = generateAccessToken({ userID: 2, role: 'admin' });
            const result = await AuthService.authorize(token, 'customer');
            expect(result.userID).toBe(2);
            expect(result.role).toBe('admin');
        });

        it('should allow admin to access admin-required route', async () => {
            const token = generateAccessToken({ userID: 3, role: 'admin' });
            const result = await AuthService.authorize(token, 'admin');
            expect(result.userID).toBe(3);
        });
    });

    // ===== resetPasswordWithOTP =====
    describe('resetPasswordWithOTP', () => {
        it('should throw on invalid email format', async () => {
            await expect(AuthService.resetPasswordWithOTP('invalid', '123456', 'newpass12')).rejects.toThrow('Email and new password are required');
        });

        it('should throw when new password is missing', async () => {
            await expect(AuthService.resetPasswordWithOTP('a@b.com', '123456', '')).rejects.toThrow('Email and new password are required');
        });

        it('should throw when new password is too short', async () => {
            await expect(AuthService.resetPasswordWithOTP('a@b.com', '123456', 'short')).rejects.toThrow('New password must be at least 8 characters and include uppercase, lowercase, number, and special character');
        });

        it('should throw when OTP is expired or not found', async () => {
            await expect(AuthService.resetPasswordWithOTP('noreset@email.com', '123456', 'Newpass12!')).rejects.toThrow('OTP expired or not found');
        });

        it('should throw when OTP is invalid', async () => {
            const hashedOtp = crypto.createHash('sha256').update('112233').digest('hex');
            await redisClient.setEx('otp:resettest@email.com', 300, hashedOtp);

            await expect(AuthService.resetPasswordWithOTP('resettest@email.com', '000000', 'Newpass12!')).rejects.toThrow('Invalid OTP');
        });

        it('should reset password successfully', async () => {
            const otp = '445566';
            const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
            await redisClient.setEx('otp:resetok@email.com', 300, hashedOtp);
            vi.mocked(UserModel.findByEmailSafe).mockResolvedValue({
                User_ID: 15, Username: 'ResetUser', Email: 'resetok@email.com',
                Role: 'customer', Is_Banned: false, Is_Email_Verified: true, Is_Phone_Verified: false,
            });
            vi.mocked(UserModel.updateUser).mockResolvedValue(true);

            await expect(AuthService.resetPasswordWithOTP('resetok@email.com', otp, 'Newpass12!')).resolves.toBeUndefined();
            expect(UserModel.updateUser).toHaveBeenCalledTimes(1);
        });
    });
});
