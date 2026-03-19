import db from '@/src/lib/mysql';
import { User } from '@/src/types/User';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const ALLOWED_UPDATE_COLUMNS: ReadonlySet<string> = new Set([
    'Username', 'Email', 'Password', 'Role', 'Phone_number',
    'Is_Phone_Verified', 'Is_Email_Verified', 'Address',
    'Verified_Date', 'RatingScore', 'Avatar_URL', 'Is_Banned'
]);

const USER_COLUMNS_WITHOUT_PASSWORD = 'User_ID, Username, Email, Role, Phone_number, Is_Phone_Verified, Is_Email_Verified, Address, Verified_Date, RatingScore, Avatar_URL, Is_Banned';

export const UserModel = {
    // 1.Get User  (Login/Check - includes Password for auth)
    findByEmail: async (email: string): Promise<User | null> => {
        const sql = `
            SELECT * FROM User
            WHERE Email = ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [email]);
        return rows.length > 0 ? (rows[0] as User) : null;
    },

    // 1b.Get User by Email without Password (safe for non-auth use)
    findByEmailSafe: async (email: string): Promise<User | null> => {
        const sql = `SELECT ${USER_COLUMNS_WITHOUT_PASSWORD} FROM User WHERE Email = ?`;
        const [rows] = await db.query<RowDataPacket[]>(sql, [email]);
        return rows.length > 0 ? (rows[0] as User) : null;
    },

    // 2.Get User by ID (Profile/Identity - includes Password for auth)
    findByID: async (id: number): Promise<User | null> => {
        const sql = `
            SELECT * FROM User
            WHERE User_ID = ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [id]);
        return rows.length > 0 ? (rows[0] as User) : null;
    },

    // 2b.Get User by ID without Password (safe for non-auth use)
    findByIDSafe: async (id: number): Promise<User | null> => {
        const sql = `SELECT ${USER_COLUMNS_WITHOUT_PASSWORD} FROM User WHERE User_ID = ?`;
        const [rows] = await db.query<RowDataPacket[]>(sql, [id]);
        return rows.length > 0 ? (rows[0] as User) : null;
    },

    // 3.Get all Users (Admin List)
    findAll: async (offset: number, limit: number): Promise<User[]> => {
        const sql = `
            SELECT User_ID, Username, Email, Role, Verified_Date, RatingScore
            FROM User
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [limit, offset]);
        return rows as User[];
    },

    // 4.Get User by Phone number (Phone number lookup)
    findByPhone: async (phone: string): Promise<User | null> => {
        const sql = `SELECT ${USER_COLUMNS_WITHOUT_PASSWORD} FROM User WHERE Phone_number = ?`;
        const [rows] = await db.query<RowDataPacket[]>(sql, [phone]);
        return rows.length > 0 ? (rows[0] as User) : null;
    },

    // 5.Get banned Users (Admin List)
    findBannedUsers: async (offset: number, limit: number): Promise<User[]> => {
        const sql = `
            SELECT User_ID, Username, Email, Role, Verified_Date, RatingScore
            FROM User
            WHERE Is_Banned = 1
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [limit, offset]);
        return rows as User[];
    },

    // 6.Create a new User (Register)
    createUser: async (userData: User): Promise<number> => {
        const sql = `
            INSERT INTO User (Username, Email, Password, Role, Phone_number, Address, Verified_Date, RatingScore)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            userData.Username,
            userData.Email,
            userData.Password,
            userData.Role || 'customer',
            userData.Phone_number || null,
            userData.Address || null,
            userData.Verified_Date || null,
            userData.RatingScore || 0
        ];
        const [result] = await db.query<ResultSetHeader>(sql, values);
        return result.insertId;
    },

    // 7.Update User (Edit Profile)
    updateUser: async (id: number, userData: Partial<User>): Promise<boolean> => {
        const keys = Object.keys(userData).filter(
            (key) => userData[key as keyof User] !== undefined && ALLOWED_UPDATE_COLUMNS.has(key)
        );
        if (keys.length === 0) return false;
        const setClause = keys.map((key) => `\`${key}\` = ?`).join(', ');
        const values = keys.map((key) => userData[key as keyof User]);
        const sql = `UPDATE User SET ${setClause} WHERE User_ID = ?`;
        const [result] = await db.query<ResultSetHeader>(sql, [...values, id]);
        return result.affectedRows > 0;
    },

    // 8.Delete User (Ban/Close Account)
    delete: async (id: number): Promise<boolean> => {
        const sql = 'DELETE FROM User WHERE User_ID = ?';
        const [result] = await db.query<ResultSetHeader>(sql, [id]);
        return result.affectedRows > 0;
    }
};
