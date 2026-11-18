import { Router } from 'express';
import * as membersController from '../controllers/adeiMembers.controller';
import { upload, validateUploadedFiles } from '../config/upload';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { adeiMemberCreateSchema, adeiMemberUpdateSchema } from '../validators/schemas';

const router = Router();

router.get('/', membersController.getAll);
router.post('/', authMiddleware, adminMiddleware, upload.single('photo'), validateUploadedFiles, validate(adeiMemberCreateSchema), membersController.create);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('photo'), validateUploadedFiles, validate(adeiMemberUpdateSchema), membersController.update);
router.delete('/:id', authMiddleware, adminMiddleware, membersController.remove);

export default router;
