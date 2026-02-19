import db from '@/lib/mysql';
import { Report } from '@/types/Report';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export const ReportModel = {
    // 1.ดึงข้อมูล Report จาก ID (Detail one by one)
    findByID: async (id: number): Promise<Report | null> => {
        const sql = `
            SELECT * FROM Report 
            WHERE ReportID = ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [id]);
        return rows.length > 0 ? (rows[0] as Report) : null;
    },

    // 2.ดึงข้อมูล Report ทั้งหมด (Admin List)
    findAll: async (): Promise<Report[]> => {
        const sql = `
            SELECT * FROM Report
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql);
        return rows as Report[];
    },

    // 3.ดึงข้อมูลแต่ละ User Report ID ออกมา (User Report List)
    findReportsByUserID: async (userID: number): Promise<Report[]> => {
        const sql = `
            SELECT * FROM Report
            WHERE ReporterID = ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [userID]);
        return rows as Report[];
    },

    // 4.สร้าง Report ใหม่(Report)
    createReport: async (reportData: Report): Promise<number> => {
        const sql = `
            INSERT INTO Report (ReporterID, TargetID, ReportType, Reason)
            VALUES (?, ?, ?, ?)
        `;
        const values = [
            reportData.ReporterID,
            reportData.TargetID,
            reportData.ReportType,
            reportData.Reason
        ];
        const [result] = await db.query<ResultSetHeader>(sql, values);
        return result.insertId;
    },
};