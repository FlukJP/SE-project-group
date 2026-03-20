import db from '@/src/lib/mysql';
import { Report } from '@/src/types/Report';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export const ReportModel = {
    // 1.Get report details (Detail one by one)
    findByID: async (id: number): Promise<Report | null> => {
        const sql = `
            SELECT * FROM Report
            WHERE Report_ID = ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [id]);
        return rows.length > 0 ? (rows[0] as Report) : null;
    },

    // 2.Get all reports (Admin List)
    findAll: async (offset: number, limit: number): Promise<Report[]> => {
        const sql = `
            SELECT
                r.Report_ID,
                r.Reporter_ID,
                reporter.Username AS ReporterName,
                r.Reported_User_ID,
                r.Reported_Product_ID,
                r.Reason,
                r.CreatedDate,
                CASE
                    WHEN r.Reported_User_ID IS NOT NULL THEN 'user'
                    WHEN r.Reported_Product_ID IS NOT NULL THEN 'product'
                END AS ReportType,
                COALESCE(r.Reported_User_ID, r.Reported_Product_ID) AS Target_ID,
                COALESCE(target_user.Username, target_product.Title) AS TargetName,
                COALESCE(target_user.Is_Banned, target_product.Is_Banned) AS TargetIsBanned
            FROM Report r
            LEFT JOIN \`User\` reporter ON r.Reporter_ID = reporter.User_ID
            LEFT JOIN \`User\` target_user ON r.Reported_User_ID = target_user.User_ID
            LEFT JOIN Product target_product ON r.Reported_Product_ID = target_product.Product_ID
            ORDER BY r.Report_ID DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [limit, offset]);
        return rows as Report[];
    },

    // 3.Get reports by User ID (User Report List)
    findReportsByUserID: async (userID: number): Promise<Report[]> => {
        const sql = `
            SELECT * FROM Report
            WHERE Reporter_ID = ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [userID]);
        return rows as Report[];
    },

    // 4.Create a new report (Report)
    createReport: async (reportData: Report): Promise<number> => {
        const sql = `
            INSERT INTO Report (Reporter_ID, Reported_User_ID, Reported_Product_ID, Reason)
            VALUES (?, ?, ?, ?)
        `;
        const values = [
            reportData.Reporter_ID,
            reportData.Reported_User_ID ?? null,
            reportData.Reported_Product_ID ?? null,
            reportData.Reason
        ];
        const [result] = await db.query<ResultSetHeader>(sql, values);
        return result.insertId;
    },
};