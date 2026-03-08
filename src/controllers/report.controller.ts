import { Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { ReportModel } from '../models/reportModel';
import { ProductModel } from '../models/productModel';
import { AuthRequest } from '../middleware/auth.middleware';

export const ReportController = {
    // 1.สร้างรายงาน (Create Report)
    createReport: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);

            const { targetId, reportType, reason } = req.body;
            if (!targetId || !reportType || !reason?.trim()) {
                throw new AppError("targetId, reportType and reason are required", 400);
            }
            if (reportType !== 'product' && reportType !== 'user') {
                throw new AppError("reportType must be 'product' or 'user'", 400);
            }

            const numericTargetId = Number(targetId);

            // ป้องกัน self-report
            if (reportType === 'user' && numericTargetId === req.user.userID) {
                throw new AppError("You cannot report yourself", 400);
            }
            if (reportType === 'product') {
                const product = await ProductModel.findByID(numericTargetId);
                if (!product) throw new AppError("Product not found", 404);
                if (product.Seller_ID === req.user.userID) {
                    throw new AppError("You cannot report your own product", 400);
                }
            }

            const reportId = await ReportModel.createReport({
                Reporter_ID: req.user.userID,
                Target_ID: numericTargetId,
                ReportType: reportType,
                Reason: reason.trim(),
            });

            res.status(201).json({
                success: true,
                message: "Report submitted successfully",
                reportId,
            });
        } catch (error) {
            next(error);
        }
    },

    // 2.ดูรายงานของตัวเอง (Get My Reports)
    getMyReports: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);

            const reports = await ReportModel.findReportsByUserID(req.user.userID);

            res.status(200).json({ success: true, data: reports });
        } catch (error) {
            next(error);
        }
    },
};
