import { Router } from 'express';
import * as clubsController from '../controllers/clubs.controller';
import { upload, validateUploadedFiles } from '../config/upload';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { asyncWrapper } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { clubCreateSchema, clubUpdateSchema } from '../validators/schemas';

const router = Router();

router.get('/', asyncWrapper(clubsController.getAll));
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), validateUploadedFiles, validate(clubCreateSchema), clubsController.create);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), validateUploadedFiles, validate(clubUpdateSchema), clubsController.update);
router.delete('/:id', authMiddleware, adminMiddleware, clubsController.remove);

export default router;
