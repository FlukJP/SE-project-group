import { Router } from 'express';
import productRoutes from './product.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import chatRoutes from './chat.routes';
import adminRoutes from './admin.routes';
import reportRoutes from './report.routes';
import categoryRoutes from './category.routes';
import reviewRoutes from './review.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/chats', chatRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);
router.use('/categories', categoryRoutes);
router.use('/reviews', reviewRoutes);

export default router;