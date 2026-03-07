import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { uploadProductImage, handleUploadError } from '../middleware/upload.middleware';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/', ProductController.getAllProducts);
router.get('/seller/:sellerId', ProductController.getProductsBySeller);
router.get('/:id', ProductController.getProductByID);
router.post('/', authenticateJWT, uploadProductImage.array('images', 5), handleUploadError, ProductController.createProduct);
router.put('/:id', authenticateJWT, uploadProductImage.array('images', 5), handleUploadError, ProductController.updateProduct);
router.delete('/:id', authenticateJWT, ProductController.deleteProduct);

export default router;
