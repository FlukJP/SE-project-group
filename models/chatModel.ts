import db from "@/lib/mysql";
import { Chat, ChatRoomWithPartner } from "@/types/Chat";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export const ChatModel = {
    // 1.ดึงข้อมูลรายการห้องแชทของ User (Chat List for User)
    findByUserID: async(userID: number): Promise<ChatRoomWithPartner[]> => {
        const sql = `
            SELECT c.*, 
                CASE 
                    WHEN c.Participant_1 = ? THEN u2.Username
                    ELSE u1.Username
                END AS PartnerName
            FROM Chat c
            JOIN User u1 ON c.Participant_1 = u1.UserID
            JOIN User u2 ON c.Participant_2 = u2.UserID
            WHERE c.Participant_1 = ? OR c.Participant_2 = ?
            ORDER BY c.Created_At DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [userID, userID, userID]);
        return rows as ChatRoomWithPartner[];
    },

    // 2.ตรวจสอบการเปิดแชทระหว่างผู้ใช้สองคน (Check if chat exists between two users)
    findExistingChat: async (p1: number, p2: number, productID: number): Promise<Chat | null> => {
        const sql = `
            SELECT * FROM Chat
            WHERE ((Participant_1 = ? AND Participant_2 = ?) OR (Participant_1 = ? AND Participant_2 = ?))
            AND Chats_product_ID = ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [p1, p2, p2, p1, productID]);
        return rows.length > 0 ? (rows[0] as Chat) : null;
    },

    // 3.ดึงข้อมูลแชท 1ห้อง (Chat Room Detail)
    findByID: async (chatID: number): Promise<Chat | null> => {
        const sql = `
            SELECT * FROM Chat
            WHERE Chat_ID = ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [chatID]);
        return rows.length > 0 ? (rows[0] as Chat) : null;
    },

    // 4.สร้างแชทใหม่ (Create new chat)
    createChatRoom: async (chatData: Chat): Promise<number> => {
        const sql = `
            INSERT INTO Chat (Participant_1, Participant_2, Chats_product_ID)
            VALUES (?, ?, ?)
        `;
        const values = [
            chatData.Participant_1,
            chatData.Participant_2,
            chatData.Chats_product_ID
        ];
        const [result] = await db.query<ResultSetHeader>(sql, values);
        return result.insertId;
    },
    // 5.ลบแชททิ้ง (Delete chat)
    deleteChatRoom(chatID: number): Promise<boolean> {
        const sql = `
            DELETE FROM Chat
            WHERE Chat_ID = ?
        `;
        return db.query<ResultSetHeader>(sql, [chatID])
            .then(([result]) => result.affectedRows > 0)
            .catch(() => false);
    }
};