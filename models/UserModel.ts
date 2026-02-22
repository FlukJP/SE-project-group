import db from '@/lib/mysql';
import { User } from '@/types/User';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export const UserModel = {
    // 1.ดึงข้อมูล User จาก Email (Login/Check)
    findByEmail: async (email: string): Promise<User | null> => {
        const sql = `
            SELECT * FROM User 
            WHERE Email = ?
        `;
        const [rows]: any = await db.query(sql, [email]);
        return rows.length > 0 ? rows[0] : null;
    },

    // 2.ดึงข้อมูล User จาก ID (Profile/Identity)
    findByID: async (id: number): Promise<User | null> => {
        const sql = `
            SELECT * FROM User 
            WHERE User_ID = ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [id]);
        return rows.length > 0 ? (rows[0] as User) : null;
    },

    // 3.ดึงรายชื่อ User ทั้งหมด (Admin List)
    findAll: async (): Promise<User[]> => {
        const sql = `
            SELECT User_ID, Username, Email, Role, Verified_Date, RatingScore FROM User
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql);
        return rows as User[];
    },

    // 4.ดึงข้อมูล User จากเบอร์โทรศัพท์ (Phone number lookup)
    findByPhone: async (phone: string): Promise<User | null> => {
        const sql = `SELECT * FROM User WHERE Phone_number = ?`;
        const [rows] = await db.query<RowDataPacket[]>(sql, [phone]);
        return rows.length > 0 ? (rows[0] as User) : null;
    },

    // 5.สร้าง User ใหม่ (Register)
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

    // 6.Update ข้อมูล User (Edit Profile)
    updateUser: async (id: number, userData: Partial<User>): Promise<boolean> => { // 👈 1. เปลี่ยน email: string เป็น id: number
        const keys = Object.keys(userData).filter(
            (key) => userData[key as keyof User] !== undefined
        );
        if (keys.length === 0) return false;
        const setClause = keys.map((key) => `${key} = ?`).join(', ');
        const values = keys.map((key) => userData[key as keyof User]);
        const sql = `UPDATE User SET ${setClause} WHERE UserID = ?`;
        const [result] = await db.query<ResultSetHeader>(sql, [...values, id]); // 👈 3. เปลี่ยนตัวแปรท้ายสุดเป็น id
        return result.affectedRows > 0;
    },

    // 7.ลบ User (Ban/Close Account)
    delete: async (id: number): Promise<boolean> => {
        const sql = 'DELETE FROM User WHERE User_ID = ?';
        const [result] = await db.query<ResultSetHeader>(sql, [id]);
        return result.affectedRows > 0;
    }
};