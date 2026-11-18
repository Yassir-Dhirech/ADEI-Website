import { Router } from 'express';
import * as partnersController from '../controllers/partners.controller';
import { upload, validateUploadedFiles } from '../config/upload';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { partnerCreateSchema, partnerUpdateSchema } from '../validators/schemas';

const router = Router();

router.get('/', partnersController.getAll);
router.post('/', authMiddleware, adminMiddleware, upload.single('logo'), validateUploadedFiles, validate(partnerCreateSchema), partnersController.create);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('logo'), validateUploadedFiles, validate(partnerUpdateSchema), partnersController.update);
router.delete('/:id', authMiddleware, adminMiddleware, partnersController.remove);
router.patch('/:id/reorder', authMiddleware, adminMiddleware, partnersController.reorder);

export default router;
