import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateJWT, requireVerified } from '../middleware/auth.middleware';
import { validateBody, createReportSchema } from '../middleware/validate.middleware';

const router = Router();

router.post('/', authenticateJWT, requireVerified, validateBody(createReportSchema), ReportController.createReport);
router.get('/me', authenticateJWT, ReportController.getMyReports);

export default router;
