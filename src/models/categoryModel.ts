import db from '@/src/lib/mysql';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { CategoryRow } from '@/src/types/Category';

export const CategoryModel = {
    findAll: async (): Promise<CategoryRow[]> => {
        const sql = `SELECT * FROM Category WHERE is_active = TRUE ORDER BY sort_order ASC, Category_ID ASC`;
        const [rows] = await db.query<RowDataPacket[]>(sql);
        return rows as CategoryRow[];
    },

    findById: async (id: number): Promise<CategoryRow | null> => {
        const sql = `SELECT * FROM Category WHERE Category_ID = ?`;
        const [rows] = await db.query<RowDataPacket[]>(sql, [id]);
        return rows.length > 0 ? (rows[0] as CategoryRow) : null;
    },

    findByKey: async (key: string): Promise<CategoryRow | null> => {
        const sql = `SELECT * FROM Category WHERE category_key = ?`;
        const [rows] = await db.query<RowDataPacket[]>(sql, [key]);
        return rows.length > 0 ? (rows[0] as CategoryRow) : null;
    },

    create: async (data: { category_key: string; name: string; emoji: string; sort_order?: number }): Promise<number> => {
        const sql = `INSERT INTO Category (category_key, name, emoji, sort_order) VALUES (?, ?, ?, ?)`;
        const [result] = await db.query<ResultSetHeader>(sql, [
            data.category_key,
            data.name,
            data.emoji,
            data.sort_order ?? 0,
        ]);
        return result.insertId;
    },

    update: async (id: number, data: Partial<{ category_key: string; name: string; emoji: string; sort_order: number; is_active: boolean }>): Promise<boolean> => {
        const fields: string[] = [];
        const values: unknown[] = [];

        if (data.category_key !== undefined) { fields.push('category_key = ?'); values.push(data.category_key); }
        if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
        if (data.emoji !== undefined) { fields.push('emoji = ?'); values.push(data.emoji); }
        if (data.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(data.sort_order); }
        if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }

        if (fields.length === 0) return false;

        values.push(id);
        const sql = `UPDATE Category SET ${fields.join(', ')} WHERE Category_ID = ?`;
        const [result] = await db.query<ResultSetHeader>(sql, values);
        return result.affectedRows > 0;
    },

    delete: async (id: number): Promise<boolean> => {
        const sql = `UPDATE Category SET is_active = FALSE WHERE Category_ID = ?`;
        const [result] = await db.query<ResultSetHeader>(sql, [id]);
        return result.affectedRows > 0;
    },
};
