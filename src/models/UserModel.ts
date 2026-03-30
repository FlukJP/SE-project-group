import db from '@/src/lib/mysql';
import { User } from '@/src/types/User';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const ALLOWED_UPDATE_COLUMNS: ReadonlySet<string> = new Set([
    'Username', 'Email', 'Password', 'Role', 'Phone_number',
    'Is_Phone_Verified', 'Is_Email_Verified', 'Address',
    'Verified_Date', 'RatingScore', 'Avatar_URL', 'Auto_Reply_Message', 'Is_Banned'
]);

const USER_COLUMNS_WITHOUT_PASSWORD_BASE = 'User_ID, Username, Email, Role, Phone_number, Is_Phone_Verified, Is_Email_Verified, Address, Verified_Date, RatingScore, Avatar_URL, Is_Banned';
const USER_COLUMNS_WITH_AUTO_REPLY = `${USER_COLUMNS_WITHOUT_PASSWORD_BASE}, Auto_Reply_Message`;
let autoReplyColumnExistsCache: boolean | null = null;

async function hasAutoReplyColumn(): Promise<boolean> {
    if (autoReplyColumnExistsCache !== null) {
        return autoReplyColumnExistsCache;
    }

    interface ColumnRow extends RowDataPacket {
        Field: string;
    }

    const [rows] = await db.query<ColumnRow[]>("SHOW COLUMNS FROM User LIKE 'Auto_Reply_Message'");
    autoReplyColumnExistsCache = rows.length > 0;
    return autoReplyColumnExistsCache;
}

async function getSafeUserColumns(): Promise<string> {
    return (await hasAutoReplyColumn()) ? USER_COLUMNS_WITH_AUTO_REPLY : USER_COLUMNS_WITHOUT_PASSWORD_BASE;
}

export const UserModel = {
    hasAutoReplyColumn,

    /** Find a user by email including password (used for authentication) */
    findByEmail: async (email: string): Promise<User | null> => {
        const sql = `
            SELECT * FROM User
            WHERE Email = ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [email]);
        return rows.length > 0 ? (rows[0] as User) : null;
    },

    /** Find a user by email excluding password (safe for non-auth use) */
    findByEmailSafe: async (email: string): Promise<User | null> => {
        const safeColumns = await getSafeUserColumns();
        const sql = `SELECT ${safeColumns} FROM User WHERE Email = ?`;
        const [rows] = await db.query<RowDataPacket[]>(sql, [email]);
        return rows.length > 0 ? (rows[0] as User) : null;
    },

    /** Find a user by ID including password (used for authentication) */
    findByID: async (id: number): Promise<User | null> => {
        const sql = `
            SELECT * FROM User
            WHERE User_ID = ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [id]);
        return rows.length > 0 ? (rows[0] as User) : null;
    },

    /** Find a user by ID excluding password (safe for non-auth use) */
    findByIDSafe: async (id: number): Promise<User | null> => {
        const safeColumns = await getSafeUserColumns();
        const sql = `SELECT ${safeColumns} FROM User WHERE User_ID = ?`;
        const [rows] = await db.query<RowDataPacket[]>(sql, [id]);
        return rows.length > 0 ? (rows[0] as User) : null;
    },

    /** Retrieve a paginated list of all users (admin use) */
    findAll: async (offset: number, limit: number): Promise<User[]> => {
        const sql = `
            SELECT User_ID, Username, Email, Role, Verified_Date, RatingScore, Is_Banned
            FROM User
            WHERE Is_Banned = 0
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [limit, offset]);
        return rows as User[];
    },

    /** Find a user by phone number */
    findByPhone: async (phone: string): Promise<User | null> => {
        const safeColumns = await getSafeUserColumns();
        const sql = `SELECT ${safeColumns} FROM User WHERE Phone_number = ?`;
        const [rows] = await db.query<RowDataPacket[]>(sql, [phone]);
        return rows.length > 0 ? (rows[0] as User) : null;
    },

    /** Retrieve a paginated list of banned users (admin use) */
    findBannedUsers: async (offset: number, limit: number): Promise<User[]> => {
        const sql = `
            SELECT User_ID, Username, Email, Role, Verified_Date, RatingScore, Is_Banned
            FROM User
            WHERE Is_Banned = 1
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [limit, offset]);
        return rows as User[];
    },

    /** Create a new user and return the inserted ID */
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

    /** Update allowed fields of a user record and return whether any row was affected */
    updateUser: async (id: number, userData: Partial<User>): Promise<boolean> => {
        const autoReplyColumnExists = await hasAutoReplyColumn();
        const keys = Object.keys(userData).filter(
            (key) => userData[key as keyof User] !== undefined && ALLOWED_UPDATE_COLUMNS.has(key)
        );
        const filteredKeys = autoReplyColumnExists
            ? keys
            : keys.filter((key) => key !== 'Auto_Reply_Message');
        if (filteredKeys.length === 0) return false;
        const setClause = filteredKeys.map((key) => `\`${key}\` = ?`).join(', ');
        const values = filteredKeys.map((key) => userData[key as keyof User]);
        const sql = `UPDATE User SET ${setClause} WHERE User_ID = ?`;
        const [result] = await db.query<ResultSetHeader>(sql, [...values, id]);
        return result.affectedRows > 0;
    },

    /** Delete a user record permanently by ID */
    delete: async (id: number): Promise<boolean> => {
        const sql = 'DELETE FROM User WHERE User_ID = ?';
        const [result] = await db.query<ResultSetHeader>(sql, [id]);
        return result.affectedRows > 0;
    }
};
