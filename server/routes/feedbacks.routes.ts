import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as feedbacksController from '../controllers/feedbacks.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { asyncWrapper } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { feedbackCreateSchema } from '../validators/schemas';

const router = Router();

const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Trop de feedbacks envoyés, veuillez réessayer plus tard.',
    code: 'RATE_LIMITED',
    error: { code: 'RATE_LIMITED', message: 'Trop de feedbacks envoyés, veuillez réessayer plus tard.' }
  }
});

router.get('/public', asyncWrapper(feedbacksController.getPublic));
router.get('/', authMiddleware, adminMiddleware, feedbacksController.getAll);
router.post('/', feedbackLimiter, validate(feedbackCreateSchema), feedbacksController.create);
router.put('/:id/read', authMiddleware, adminMiddleware, feedbacksController.markRead);
router.put('/:id/publish', authMiddleware, adminMiddleware, feedbacksController.publish);
router.post('/:id/like', authMiddleware, feedbacksController.toggleLike);
router.delete('/:id', authMiddleware, adminMiddleware, feedbacksController.remove);

export default router;
