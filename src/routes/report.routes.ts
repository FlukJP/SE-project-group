import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateJWT, requireVerified } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateJWT, requireVerified, ReportController.createReport);
router.get('/me', authenticateJWT, ReportController.getMyReports);

export default router;
