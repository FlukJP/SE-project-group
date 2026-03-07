import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateJWT, ReportController.createReport);
router.get('/me', authenticateJWT, ReportController.getMyReports);

export default router;
