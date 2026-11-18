import { Router } from 'express';
import * as controller from '../controllers/academic.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { asyncWrapper } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncWrapper(controller.getTree));
router.put('/years/:id', authMiddleware, adminMiddleware, asyncWrapper(controller.updateYear));
router.put('/sections/:id', authMiddleware, adminMiddleware, asyncWrapper(controller.updateSection));

export default router;
