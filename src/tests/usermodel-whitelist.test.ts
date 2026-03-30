import { describe, it, expect, vi } from 'vitest';
import { User } from '@/src/types/User';

// Mock the db module before importing UserModel
vi.mock('@/src/lib/mysql', () => ({
    default: {
        query: vi.fn(async (sql: string) => {
            if (sql.includes("SHOW COLUMNS FROM User LIKE 'Auto_Reply_Message'")) {
                return [[{ Field: 'Auto_Reply_Message' }], undefined];
            }
            return [{ affectedRows: 1 }, undefined];
        }),
    },
}));

import { UserModel } from '@/src/models/UserModel';
import db from '@/src/lib/mysql';

describe('UserModel.updateUser - SQL injection protection', () => {
    it('should filter out columns not in the whitelist', async () => {
        await UserModel.updateUser(1, {
            Username: 'safe_name',
        });

        expect(db.query).toHaveBeenCalled();
        const [sql] = vi.mocked(db.query).mock.calls.at(-1)!;
        expect(sql).toContain('`Username`');
        expect(sql).not.toContain('DROP');
    });

    it('should reject keys not in ALLOWED_UPDATE_COLUMNS', async () => {
        const result = await UserModel.updateUser(1, {
            'DROP TABLE User; --': 'malicious',
        } as unknown as Partial<User>);

        // Should return false because no valid columns remain
        expect(result).toBe(false);
    });

    it('should allow legitimate columns', async () => {
        await UserModel.updateUser(1, {
            Username: 'test',
            Is_Banned: true,
            Avatar_URL: '/uploads/test.jpg',
            Auto_Reply_Message: 'ตอบกลับภายหลัง',
        });

        const [sql, params] = vi.mocked(db.query).mock.calls.at(-1)!;
        expect(sql).toContain('`Username`');
        expect(sql).toContain('`Is_Banned`');
        expect(sql).toContain('`Avatar_URL`');
        expect(sql).toContain('`Auto_Reply_Message`');
        expect(params).toEqual(['test', true, '/uploads/test.jpg', 'ตอบกลับภายหลัง', 1]);
    });
});
