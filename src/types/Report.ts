export interface Report {
    Report_ID?: number;           // ใส่ ? เพราะตอนสร้างรีพอร์ตใหม่ DB จะรัน ID ให้เอง
    Reporter_ID: number;          // ID ของคนที่กดรีพอร์ต
    Reason: string;               // เหตุผลที่รีพอร์ต
    CreatedDate?: Date | string;  // ใส่ string เผื่อไว้กรณีดึงมาจาก API แล้วติดรูปแบบ ISO String
    // แยกเป็น 2 ฟิลด์ตาม Database จริง และอนุญาตให้เป็น null หรือไม่ใส่ก็ได้
    Reported_User_ID?: number | null;    // ใส่ค่าเมื่อรีพอร์ต "ผู้ใช้งาน"
    Reported_Product_ID?: number | null; // ใส่ค่าเมื่อรีพอร์ต "สินค้า"
}