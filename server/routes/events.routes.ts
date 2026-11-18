import { Router } from 'express';
import * as eventsController from '../controllers/events.controller';
import { upload, validateUploadedFiles } from '../config/upload';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { asyncWrapper } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { eventCreateSchema, eventUpdateSchema } from '../validators/schemas';

const router = Router();

const eventUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 }
]);

router.get('/', asyncWrapper(eventsController.getAll));
router.post('/', authMiddleware, adminMiddleware, eventUpload, validateUploadedFiles, validate(eventCreateSchema), eventsController.create);
router.put('/:id', authMiddleware, adminMiddleware, eventUpload, validateUploadedFiles, validate(eventUpdateSchema), eventsController.update);
router.delete('/:id', authMiddleware, adminMiddleware, eventsController.remove);
router.patch('/:id/reorder', authMiddleware, adminMiddleware, eventsController.reorder);

export default router;
