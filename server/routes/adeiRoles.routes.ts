import { Router } from 'express';
import * as controller from '../controllers/adeiRoles.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { asyncWrapper } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { adeiRoleCreateSchema, adeiRoleUpdateSchema } from '../validators/schemas';

const router = Router();

router.get('/', asyncWrapper(controller.getAll));
router.post('/', authMiddleware, adminMiddleware, validate(adeiRoleCreateSchema), asyncWrapper(controller.create));
router.put('/:id', authMiddleware, adminMiddleware, validate(adeiRoleUpdateSchema), asyncWrapper(controller.update));
router.delete('/:id', authMiddleware, adminMiddleware, asyncWrapper(controller.remove));

export default router;
