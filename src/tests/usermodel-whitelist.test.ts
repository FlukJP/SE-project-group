import { describe, it, expect, vi } from 'vitest';

// Mock the db module before importing UserModel
vi.mock('@/src/lib/mysql', () => ({
    default: {
        query: vi.fn().mockResolvedValue([{ affectedRows: 1 }]),
    },
}));

import { UserModel } from '@/src/models/UserModel';
import db from '@/src/lib/mysql';

describe('UserModel.updateUser - SQL injection protection', () => {
    it('should filter out columns not in the whitelist', async () => {
        await UserModel.updateUser(1, {
            Username: 'safe_name',
        } as any);

        expect(db.query).toHaveBeenCalled();
        const [sql] = (db.query as any).mock.calls[0];
        expect(sql).toContain('`Username`');
        expect(sql).not.toContain('DROP');
    });

    it('should reject keys not in ALLOWED_UPDATE_COLUMNS', async () => {
        const result = await UserModel.updateUser(1, {
            'DROP TABLE User; --': 'malicious',
        } as any);

        // Should return false because no valid columns remain
        expect(result).toBe(false);
    });

    it('should allow legitimate columns', async () => {
        await UserModel.updateUser(1, {
            Username: 'test',
            Is_Banned: true,
            Avatar_URL: '/uploads/test.jpg',
        });

        const [sql, params] = (db.query as any).mock.calls.at(-1);
        expect(sql).toContain('`Username`');
        expect(sql).toContain('`Is_Banned`');
        expect(sql).toContain('`Avatar_URL`');
        expect(params).toEqual(['test', true, '/uploads/test.jpg', 1]);
    });
});
