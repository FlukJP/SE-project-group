import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// ทุก route ต้อง login + เป็น admin เท่านั้น
router.use(authenticateJWT, authorizeRoles(['admin']));

// Users management
router.get('/users', AdminController.getAllUsers);
router.get('/users/banned', AdminController.getBannedUsers);
router.patch('/users/:userId/ban', AdminController.banUser);
router.patch('/users/:userId/unban', AdminController.unbanUser);

// Products management
router.get('/products/banned', AdminController.getBannedProducts);
router.patch('/products/:productId/ban', AdminController.banProduct);
router.patch('/products/:productId/unban', AdminController.unbanProduct);

// Reports
router.get('/reports', AdminController.getAllReports);

export default router;
