import { Router } from 'express';
import * as filieresController from '../controllers/filieres.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { asyncWrapper } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { filiereCreateSchema, filiereUpdateSchema } from '../validators/schemas';

const router = Router();

router.get('/', asyncWrapper(filieresController.getAll));
router.post('/', authMiddleware, adminMiddleware, validate(filiereCreateSchema), filieresController.create);
router.put('/:id', authMiddleware, adminMiddleware, validate(filiereUpdateSchema), filieresController.update);
router.delete('/:id', authMiddleware, adminMiddleware, filieresController.remove);

export default router;
