import { Router } from 'express';
import * as newsController from '../controllers/news.controller';
import { upload, validateUploadedFiles } from '../config/upload';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { asyncWrapper } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { newsCreateSchema, newsUpdateSchema } from '../validators/schemas';

const router = Router();

const newsUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 }
]);

router.get('/', asyncWrapper(newsController.getAll));
router.post('/', authMiddleware, adminMiddleware, newsUpload, validateUploadedFiles, validate(newsCreateSchema), newsController.create);
router.put('/:id', authMiddleware, adminMiddleware, newsUpload, validateUploadedFiles, validate(newsUpdateSchema), newsController.update);
router.delete('/:id', authMiddleware, adminMiddleware, newsController.remove);
router.patch('/:id/reorder', authMiddleware, adminMiddleware, newsController.reorder);

export default router;
