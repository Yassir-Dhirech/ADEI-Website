import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { changePasswordSchema, createUserSchema, updateUserSchema } from '../validators/schemas';

const router = Router();

router.get('/me', authMiddleware, usersController.getMe);
router.get('/password-security', authMiddleware, usersController.getPasswordSecurity);
router.post('/change-password', authMiddleware, validate(changePasswordSchema), usersController.changePassword);

router.get('/', authMiddleware, adminMiddleware, usersController.getAll);
router.post('/', authMiddleware, adminMiddleware, validate(createUserSchema), usersController.create);
router.put('/:id', authMiddleware, adminMiddleware, validate(updateUserSchema), usersController.update);
router.delete('/:id', authMiddleware, adminMiddleware, usersController.remove);
router.patch('/:id/status', authMiddleware, adminMiddleware, usersController.updateStatus);

export default router;
