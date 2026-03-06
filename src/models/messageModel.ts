import db from "@/src/lib/mysql";
import { Message, MessageWithSender } from "@/src/types/Messages";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export const MessageModel = {
    // 1.ดึงข้อมูลจาก Chat ID (Chat Message List)
    findByChatID: async (chatID: number, limit: number = 50, offset: number = 0): Promise<MessageWithSender[]> =>{
        const sql = `
        SELECT * FROM (
            SELECT m.*, u.Username AS SenderName
            FROM Message m
            JOIN User u ON m.Sender_ID = u.User_ID
            WHERE m.Chat_ID = ?
            ORDER BY m.\`Timestamp\` DESC
            LIMIT ? OFFSET ?
        ) AS sub
        ORDER BY sub.\`Timestamp\` ASC; 
    `;
    const [rows] = await db.query<RowDataPacket[]>(sql, [chatID, limit, offset]);
    return rows as MessageWithSender[];
    },

    // 2.สร้างข้อความใหม่ (Create Message)
    createMessageTransaction: async (message: Message): Promise<number> => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const insertMsgSql = `
                INSERT INTO Message (Chat_ID, Sender_ID, Content, MessagesType, \`Timestamp\`)
                VALUES (?, ?, ?, ?, NOW())
            `;
            const [msgResult] = await connection.query<ResultSetHeader>(insertMsgSql, [
                message.Chat_ID,
                message.Sender_ID,
                message.Content,
                message.MessagesType
            ]);
            const newMsgID = msgResult.insertId;
            const updateChatSql = `
                UPDATE Chat 
                SET Is_Deleted_By_P1 = 0, 
                    Is_Deleted_By_P2 = 0,
                    \`Timestamp\` = NOW()
                WHERE Chat_ID = ?
            `;
            await connection.query(updateChatSql, [message.Chat_ID]);
            await connection.commit();
            return newMsgID;
        } 
        catch (error) {
            await connection.rollback();
            throw error;
        } 
        finally { connection.release(); }
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
        interface CountResult extends RowDataPacket { UnreadCount: number }
        const [rows] = await db.query<CountResult[]>(sql, [userID, userID, userID]);
        return rows[0]?.UnreadCount || 0;
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
