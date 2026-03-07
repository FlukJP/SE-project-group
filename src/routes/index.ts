import { Router } from 'express';
import productRoutes from './product.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);

export default router;