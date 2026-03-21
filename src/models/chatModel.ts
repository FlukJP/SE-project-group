import db from "@/src/lib/mysql";
import { Chat, ChatRoomWithPartner } from "@/src/types/Chat";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export const ChatModel = {
    /** Retrieve all chat rooms for a user with partner info, last message, and unread count */
    findByUserID: async (userID: number): Promise<ChatRoomWithPartner[]> => {
        const sql = `
            SELECT c.*,
                CASE
                    WHEN c.Participant_1 = ? THEN u2.Username
                    ELSE u1.Username
                END AS PartnerName,
                p.Title AS ProductTitle,
                p.Image_URL AS ProductImage,
                lm.Content AS LastMessage,
                lm.\`Timestamp\` AS LastMessageTime,
                COALESCE(unread.cnt, 0) AS UnreadCount
            FROM Chat c
            JOIN User u1 ON c.Participant_1 = u1.User_ID
            JOIN User u2 ON c.Participant_2 = u2.User_ID
            LEFT JOIN Product p ON c.Chats_product_ID = p.Product_ID
            LEFT JOIN (
                SELECT m1.Chat_ID, m1.Content, m1.\`Timestamp\`
                FROM Message m1
                INNER JOIN (
                    SELECT Chat_ID, MAX(Messages_ID) AS MaxID
                    FROM Message
                    GROUP BY Chat_ID
                ) m2 ON m1.Messages_ID = m2.MaxID
            ) lm ON c.Chat_ID = lm.Chat_ID
            LEFT JOIN (
                SELECT Chat_ID, COUNT(*) AS cnt
                FROM Message
                WHERE Sender_ID != ? AND Is_Read = 0
                GROUP BY Chat_ID
            ) unread ON c.Chat_ID = unread.Chat_ID
            WHERE ((c.Participant_1 = ? AND (c.Is_Deleted_By_P1 = 0 OR c.Is_Deleted_By_P1 IS NULL))
               OR (c.Participant_2 = ? AND (c.Is_Deleted_By_P2 = 0 OR c.Is_Deleted_By_P2 IS NULL)))
            ORDER BY COALESCE(lm.\`Timestamp\`, c.Created_At) DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [userID, userID, userID, userID]);
        return rows as ChatRoomWithPartner[];
    },

    /** Check whether a chat room already exists between two participants for a specific product */
    findExistingChat: async (p1: number, p2: number, productID: number): Promise<Chat | null> => {
        const sql = `
            SELECT * FROM Chat
            WHERE ((Participant_1 = ? AND Participant_2 = ?) OR (Participant_1 = ? AND Participant_2 = ?))
            AND Chats_product_ID = ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [p1, p2, p2, p1, productID]);
        return rows.length > 0 ? (rows[0] as Chat) : null;
    },

    /** Find a chat room by its ID */
    findByID: async (chatID: number): Promise<Chat | null> => {
        const sql = `
            SELECT * FROM Chat
            WHERE Chat_ID = ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [chatID]);
        return rows.length > 0 ? (rows[0] as Chat) : null;
    },

    /** Create a new chat room and return the inserted ID */
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

    /** Soft-delete a chat room for one participant by setting the corresponding deletion flag */
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
