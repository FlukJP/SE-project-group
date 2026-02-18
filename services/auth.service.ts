import db from '@/lib/mysql'; // เรียกตัวเชื่อม Database
import { User } from '@/types/User'; // เรียก Type ที่เราเพิ่งทำ
import bcrypt from 'bcrypt'; // ตัวช่วยเข้ารหัส

//แบบร่าง Register(สมัครสมาชิก) และ Login(เข้าสู่ระบบ)

export const AuthService = {

    // ==========================================
    // 1. ฟังก์ชันสมัครสมาชิก (Register)
    // ==========================================
    register: async (userData: User) => {
        // 1. ตรวจสอบก่อนว่า Email นี้เคยสมัครหรือยัง?
        const checkSql = 'SELECT UserID FROM user WHERE Email = ?';
        const [existingUsers]: any = await db.query(checkSql, [userData.Email]);

        if (existingUsers.length > 0) {
            throw new Error('อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น');
        }

        // 2. เข้ารหัสรหัสผ่าน (Hashing) ความปลอดภัยสูง
        // userData.Password! ใส่ ! เพื่อยืนยันว่ามีค่าแน่ๆ
        const hashedPassword = await bcrypt.hash(userData.Password!, 10);

        // 3. เตรียมคำสั่ง SQL บันทึกข้อมูล
        // เรากำหนด Role เป็น 'customer' เป็นค่าเริ่มต้นเสมอเพื่อความปลอดภัย
        const sql = `
    INSERT INTO user (Username, Email, Password, Role, Phone_number, Address) 
    VALUES (?, ?, ?, ?, ?, ?)
    `;

        // 4. บันทึกลง Database
        const [result]: any = await db.query(sql, [
            userData.Username,
            userData.Email,
            hashedPassword,
            'customer', // บังคับเป็น customer ก่อน
            userData.Phone_number || null, // ถ้าไม่มีให้ใส่ null
            userData.Address || null       // ถ้าไม่มีให้ใส่ null
        ]);

        return {
            message: 'สมัครสมาชิกสำเร็จ',
            userId: result.insertId
        };
    },

    // ==========================================
    // 2. ฟังก์ชันเข้าสู่ระบบ (Login)
    // ==========================================
    login: async (email: string, passwordPlain: string) => {
        // 1. ค้นหา User จากอีเมล
        const sql = 'SELECT * FROM user WHERE Email = ?';
        const [users]: any = await db.query(sql, [email]);

        if (users.length === 0) {
            throw new Error('ไม่พบอีเมลนี้ในระบบ');
        }

        const user = users[0];

        // 2. ตรวจสอบรหัสผ่าน (เอารหัสที่พิมพ์ มาเทียบกับรหัสที่เข้ารหัสไว้)
        const isMatch = await bcrypt.compare(passwordPlain, user.Password);

        if (!isMatch) {
            throw new Error('รหัสผ่านไม่ถูกต้อง');
        }

        // 3. ถ้าผ่านหมด ให้ลบรหัสผ่านออกจาก Object ก่อนส่งกลับไปหน้าเว็บ (เพื่อความปลอดภัย)
        const { Password, ...userWithoutPassword } = user;

        return userWithoutPassword; // ส่งข้อมูล User กลับไป (เอาไปทำ Session ต่อ)
    }
};