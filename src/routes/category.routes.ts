import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';
import { validateBody, validateParams, createCategorySchema, idParam } from '../middleware/validate.middleware';

const router = Router();

router.get('/', CategoryController.getAll);
router.get('/popular', CategoryController.getPopular);

router.post('/', authenticateJWT, authorizeRoles(['admin']), validateBody(createCategorySchema), CategoryController.create);
router.put('/:id', authenticateJWT, authorizeRoles(['admin']), validateParams(idParam), CategoryController.update);
router.delete('/:id', authenticateJWT, authorizeRoles(['admin']), validateParams(idParam), CategoryController.delete);

export default router;
