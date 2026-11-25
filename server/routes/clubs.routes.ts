import { Router } from 'express';
import * as clubsController from '../controllers/clubs.controller';
import { upload, validateUploadedFiles } from '../config/upload';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { asyncWrapper } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { clubCreateSchema, clubUpdateSchema } from '../validators/schemas';

const router = Router();

// Routes publiques
router.get('/', asyncWrapper(clubsController.getAll));

// Espace Président de club (authentifié)
router.get('/my-club', authMiddleware, asyncWrapper(clubsController.getMyClub));
router.put('/:id/propose-update', authMiddleware, upload.single('image'), validateUploadedFiles, asyncWrapper(clubsController.proposeUpdate));

// Modération ADEI Admin
router.post('/:id/approve-update', authMiddleware, adminMiddleware, asyncWrapper(clubsController.approveUpdate));
router.post('/:id/reject-update', authMiddleware, adminMiddleware, asyncWrapper(clubsController.rejectUpdate));

// Administration générale des clubs
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), validateUploadedFiles, validate(clubCreateSchema), clubsController.create);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), validateUploadedFiles, validate(clubUpdateSchema), clubsController.update);
router.delete('/:id', authMiddleware, adminMiddleware, clubsController.remove);

export default router;