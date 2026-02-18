import db from '@/lib/mysql';
import { User } from '@/types/User';

export const UserModel = {
    // หน้าที่ 1: เช็คว่ามีอีเมลนี้ในระบบหรือยัง (หาของ)
    findByEmail: async (email: string): Promise<User | null> => {
        const sql = 'SELECT * FROM User WHERE Email = ?';
        const [rows]: any = await db.query(sql, [email]);
        return rows.length > 0 ? rows[0] : null;
    },

    // หน้าที่ 2: บันทึกข้อมูลลงตาราง (วางของลงกล่อง)
    create: async (user: User) => {
        const sql = `
    INSERT INTO User 
    (Username, Email, Password, Role, Phone_number, Address, Verified_Date, RatingScore)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
        const values = [
            user.Username,
            user.Email,
            user.Password,
            user.Role,
            user.Phone_number,
            user.Address,
            user.Verified_Date,
            user.RatingScore
        ];
        return await db.query(sql, values);
    }
};