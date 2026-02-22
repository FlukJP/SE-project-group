import db from "@/lib/mysql";
import { Message, MessageWithSender } from "@/types/Messages";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export const MessageModel = {
    // 1.ดึงข้อมูลจาก Chat ID (Chat Message List)
    findByChatID: async (chatID: number): Promise<MessageWithSender[]> =>{
        const sql = `
            SELECT m.*, u.Username AS SenderName
            FROM Message m
            JOIN User u ON m.Sender_ID = u.User_ID
            WHERE m.Chat_ID = ?
            ORDER BY m.Created_At ASC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [chatID]);
        return rows as MessageWithSender[];
    },

    // 2.สร้างข้อความใหม่ (Create Message)
    createMessage: async (message: Message): Promise<number> => {
        const sql = `
            INSERT INTO Message (Chat_ID, Sender_ID, Content, MessagesType, Created_At)
            VALUES (?, ?, ?, ?, NOW())
        `;
        const [result] = await db.query<ResultSetHeader>(sql, [
            message.Chat_ID,
            message.Sender_ID,
            message.Content,
            message.MessagesType || 'text'
        ]);
        return result.insertId;
    },

    // 3.นับข้อความที่ยังไม่อ่านใน Chat (Unread Message Count)
    countUnreadByUserID: async (userID: number): Promise<number> => {
        const sql = `
            SELECT COUNT(*) AS UnreadCount
            FROM Message m
            JOIN Chat c ON m.Chat_ID = c.Chat_ID
            WHERE (c.Participant_1 = ? OR c.Participant_2 = ?) 
            AND m.Sender_ID != ? 
            AND m.Is_Read = 0
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [userID, userID, userID]);
        return (rows[0] as any).UnreadCount || 0;
    },

    // 4.อัพเดทสถานะข้อความเป็น "read" (Mark as Read)
    updateReadStatus: async (chatID: number, receiverID: number): Promise<void> => {
        const sql = `
            UPDATE Message
            SET Is_Read = 1
            WHERE Chat_ID = ? AND Sender_ID != ? AND Is_Read = 0
        `;
        await db.query(sql, [chatID, receiverID]);
    },
}
