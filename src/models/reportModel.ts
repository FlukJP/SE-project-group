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
            SELECT * FROM Report
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