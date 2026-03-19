import db from '@/src/lib/mysql';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface PopularCategoryRow {
    category_key: string;
    name: string;
    emoji: string;
    score: number;
}

export const CategoryPopularityModel = {
    // 1.Record a search or purchase event for a category
    record: async (categoryKey: string, eventType: 'search' | 'purchase'): Promise<void> => {
        const sql = `INSERT INTO CategoryPopularity (category_key, event_type) VALUES (?, ?)`;
        await db.query<ResultSetHeader>(sql, [categoryKey, eventType]);
    },

    // 2.Get popular categories based on search and purchase events in the last 7 days
    getPopular: async (limit = 10): Promise<PopularCategoryRow[]> => {
        const sql = `
            SELECT
                cp.category_key,
                c.name,
                c.emoji,
                SUM(CASE WHEN cp.event_type = 'purchase' THEN 3 ELSE 1 END) AS score
            FROM CategoryPopularity cp
            JOIN Category c ON cp.category_key = c.category_key AND c.is_active = TRUE
            WHERE cp.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY cp.category_key, c.name, c.emoji
            ORDER BY score DESC
            LIMIT ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [limit]);
        return rows as PopularCategoryRow[];
    },
};
