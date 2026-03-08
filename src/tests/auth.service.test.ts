import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '@/src/services/auth.service';
import { UserModel } from '@/src/models/UserModel';
import { AppError } from '@/src/errors/AppError';

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
    },
}));

describe('AuthService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
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
            ).rejects.toThrow('Password must be at least 8 characters');
        });

        it('should throw on invalid phone number', async () => {
            await expect(
                AuthService.register({ Username: 'Test User', Email: 'test@email.com', Password: '12345678', Phone_number: '123', Role: 'customer' })
            ).rejects.toThrow('Phone number must be 10 digits');
        });

        it('should throw when email is already in use', async () => {
            vi.mocked(UserModel.findByEmailSafe).mockResolvedValue({
                User_ID: 1, Username: 'Existing', Email: 'test@email.com', Role: 'customer',
                Is_Banned: false, Is_Email_Verified: false, Is_Phone_Verified: false,
            } as any);

            await expect(
                AuthService.register({ Username: 'New User', Email: 'test@email.com', Password: '12345678', Phone_number: '0812345678', Role: 'customer' })
            ).rejects.toThrow('Email already in use');
        });

        it('should throw when phone is already in use', async () => {
            vi.mocked(UserModel.findByEmailSafe).mockResolvedValue(null);
            vi.mocked(UserModel.findByPhone).mockResolvedValue({
                User_ID: 2, Username: 'Existing', Email: 'other@email.com', Role: 'customer',
            } as any);

            await expect(
                AuthService.register({ Username: 'New User', Email: 'new@email.com', Password: '12345678', Phone_number: '0812345678', Role: 'customer' })
            ).rejects.toThrow('Phone number already in use');
        });

        it('should register successfully and return insertId', async () => {
            vi.mocked(UserModel.findByEmailSafe).mockResolvedValue(null);
            vi.mocked(UserModel.findByPhone).mockResolvedValue(null);
            vi.mocked(UserModel.createUser).mockResolvedValue(42);

            const result = await AuthService.register({
                Username: 'New User',
                Email: 'new@email.com',
                Password: '12345678',
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
            await expect(AuthService.changePassword(1, 'oldpass12', 'short')).rejects.toThrow('New password must be at least 8 characters');
        });

        it('should throw when user not found', async () => {
            vi.mocked(UserModel.findByID).mockResolvedValue(null);

            await expect(AuthService.changePassword(999, 'oldpass12', 'newpass12')).rejects.toThrow('User not found');
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
    });
});
