import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { uploadProductImage, handleUploadError, validateImageMagicBytes } from '../middleware/upload.middleware';
import { authenticateJWT, requireVerified } from '../middleware/auth.middleware';
import { validateParams, idParam, sellerIdParam } from '../middleware/validate.middleware';

const router = Router();

router.get('/', ProductController.getAllProducts);
router.get('/seller/:sellerId', validateParams(sellerIdParam), ProductController.getProductsBySeller);
router.get('/:id', validateParams(idParam), ProductController.getProductByID);
router.post('/', authenticateJWT, requireVerified, uploadProductImage.array('images', 5), handleUploadError, validateImageMagicBytes, ProductController.createProduct);
router.put('/:id', authenticateJWT, requireVerified, validateParams(idParam), uploadProductImage.array('images', 5), handleUploadError, validateImageMagicBytes, ProductController.updateProduct);
router.delete('/:id', authenticateJWT, requireVerified, validateParams(idParam), ProductController.deleteProduct);

export default router;
