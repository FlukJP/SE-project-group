import db from "@/lib/mysql";
import { Message } from "@/types/Messages";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export const MessageModel = {
    // 1.ดึงข้อมูลจาก Chat ID (Chat Message List)
    // 2.สร้างข้อความใหม่ (Create Message)
    // 3.นับข้อความที่ยังไม่อ่านใน Chat (Unread Message Count)
    // 4.อัพเดทสถานะข้อความเป็น "read" (Mark as Read)
    // 5.แก้ไขข้อความ (Edit Message)
    // 6.ลบข้อความ (Delete Message)
}