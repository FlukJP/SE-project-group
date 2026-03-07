import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT, authorizeRoles(['admin']));

router.get('/users', AdminController.getAllUsers);
router.get('/users/banned', AdminController.getBannedUsers);
router.patch('/users/:userId/ban', AdminController.banUser);
router.patch('/users/:userId/unban', AdminController.unbanUser);

router.get('/products/banned', AdminController.getBannedProducts);
router.patch('/products/:productId/ban', AdminController.banProduct);
router.patch('/products/:productId/unban', AdminController.unbanProduct);

router.get('/reports', AdminController.getAllReports);

export default router;
