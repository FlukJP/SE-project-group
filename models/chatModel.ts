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
            JOIN User u1 ON c.Participant_1 = u1.User_ID
            JOIN User u2 ON c.Participant_2 = u2.User_ID
            WHERE (c.Participant_1 = ? AND (c.Is_Deleted_By_P1 = 0 OR c.Is_Deleted_By_P1 IS NULL)) 
            OR (c.Participant_2 = ? AND (c.Is_Deleted_By_P2 = 0 OR c.Is_Deleted_By_P2 IS NULL))
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
    hideChatForParticipant: async (chatID: number, participantRole: 'P1' | 'P2'): Promise<boolean> => {
        const fieldToUpdate = participantRole === 'P1' ? 'Is_Deleted_By_P1' : 'Is_Deleted_By_P2';

        const sql = `
            UPDATE Chat 
            SET ?? = 1 
            WHERE Chat_ID = ?
        `;
        const [result] = await db.query<ResultSetHeader>(sql, [fieldToUpdate, chatID]);
        return result.affectedRows > 0;
    }
};