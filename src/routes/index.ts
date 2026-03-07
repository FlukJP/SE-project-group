import { Router } from 'express';
import productRoutes from './product.routes';
import authRoutes from './auth.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);

export default router;