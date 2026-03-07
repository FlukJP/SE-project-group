import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.get('/', CategoryController.getAll);
router.get('/popular', CategoryController.getPopular);

router.post('/', authenticateJWT, authorizeRoles(['admin']), CategoryController.create);
router.put('/:id', authenticateJWT, authorizeRoles(['admin']), CategoryController.update);
router.delete('/:id', authenticateJWT, authorizeRoles(['admin']), CategoryController.delete);

export default router;
