import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '@/src/services/user.service';
import { UserModel } from '@/src/models/UserModel';

vi.mock('@/src/models/UserModel');

const sampleUser = {
    User_ID: 1,
    Username: 'TestUser',
    Email: 'test@email.com',
    Role: 'customer' as const,
    Phone_number: '0812345678',
    Is_Phone_Verified: false,
    Is_Email_Verified: false,
    Is_Banned: false,
};

describe('UserService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    // ===== getProfile =====
    describe('getProfile', () => {
        it('should return user profile when found', async () => {
            vi.mocked(UserModel.findByIDSafe).mockResolvedValue(sampleUser);

            const result = await UserService.getProfile({ userID: 1 });
            expect(result).toEqual(sampleUser);
            expect(UserModel.findByIDSafe).toHaveBeenCalledWith(1);
        });

        it('should throw 404 when user not found', async () => {
            vi.mocked(UserModel.findByIDSafe).mockResolvedValue(null);

            await expect(UserService.getProfile({ userID: 999 })).rejects.toThrow('User not found');
        });
    });

    // ===== updateProfile =====
    describe('updateProfile', () => {
        it('should throw when no valid fields provided', async () => {
            await expect(
                UserService.updateProfile({ userID: 1, updateData: { Role: 'customer' } })
            ).rejects.toThrow('No valid fields to update');
        });

        it('should throw on invalid phone number format', async () => {
            await expect(
                UserService.updateProfile({ userID: 1, updateData: { Phone_number: '123' } })
            ).rejects.toThrow('Phone number must be 10 digits');
        });

        it('should throw 404 when user not found', async () => {
            vi.mocked(UserModel.findByIDSafe).mockResolvedValue(null);

            await expect(
                UserService.updateProfile({ userID: 999, updateData: { Username: 'NewName' } })
            ).rejects.toThrow('User not found');
        });

        it('should update username successfully', async () => {
            vi.mocked(UserModel.findByIDSafe).mockResolvedValue(sampleUser);
            vi.mocked(UserModel.updateUser).mockResolvedValue(true);

            const result = await UserService.updateProfile({ userID: 1, updateData: { Username: 'Updated' } });
            expect(result).toBe(true);
            expect(UserModel.updateUser).toHaveBeenCalledTimes(1);
        });

        it('should throw 500 when update fails', async () => {
            vi.mocked(UserModel.findByIDSafe).mockResolvedValue(sampleUser);
            vi.mocked(UserModel.updateUser).mockResolvedValue(false);

            await expect(
                UserService.updateProfile({ userID: 1, updateData: { Username: 'Updated' } })
            ).rejects.toThrow('The data update failed. Please try again.');
        });

        it('should reset phone verification when phone number changes', async () => {
            vi.mocked(UserModel.findByIDSafe).mockResolvedValue(sampleUser);
            vi.mocked(UserModel.updateUser).mockResolvedValue(true);

            await UserService.updateProfile({ userID: 1, updateData: { Phone_number: '0899999999' } });

            expect(UserModel.updateUser).toHaveBeenCalledWith(
                1,
                expect.objectContaining({ Is_Phone_Verified: false })
            );
        });

        it('should not reset phone verification when phone number is the same', async () => {
            vi.mocked(UserModel.findByIDSafe).mockResolvedValue(sampleUser);
            vi.mocked(UserModel.updateUser).mockResolvedValue(true);

            await UserService.updateProfile({ userID: 1, updateData: { Phone_number: '0812345678' } });

            const callArgs = vi.mocked(UserModel.updateUser).mock.calls[0][1];
            expect(callArgs.Is_Phone_Verified).toBeUndefined();
        });

        it('should update avatar URL successfully', async () => {
            vi.mocked(UserModel.findByIDSafe).mockResolvedValue(sampleUser);
            vi.mocked(UserModel.updateUser).mockResolvedValue(true);

            const result = await UserService.updateProfile({
                userID: 1,
                updateData: { Avatar_URL: 'https://example.com/avatar.jpg' },
            });
            expect(result).toBe(true);
        });

        it('should update auto reply message successfully', async () => {
            vi.mocked(UserModel.findByIDSafe).mockResolvedValue(sampleUser);
            vi.mocked(UserModel.updateUser).mockResolvedValue(true);

            const result = await UserService.updateProfile({
                userID: 1,
                updateData: { Auto_Reply_Message: 'ตอนนี้ไม่สะดวกตอบ เดี๋ยวกลับมาตอบนะครับ' },
            });

            expect(result).toBe(true);
            expect(UserModel.updateUser).toHaveBeenCalledWith(
                1,
                expect.objectContaining({ Auto_Reply_Message: 'ตอนนี้ไม่สะดวกตอบ เดี๋ยวกลับมาตอบนะครับ' })
            );
        });
    });
});
