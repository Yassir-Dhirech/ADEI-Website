const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const feedbacksController = require('../controllers/feedbacks.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { asyncWrapper } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validate');
const { feedbackCreateSchema } = require('../validators/schemas');

const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, message: 'Trop de feedbacks envoyés, veuillez réessayer plus tard.', code: 'RATE_LIMITED', error: { code: 'RATE_LIMITED', message: 'Trop de feedbacks envoyés, veuillez réessayer plus tard.' } }
});

router.get('/public', asyncWrapper(feedbacksController.getPublic));
router.get('/', authMiddleware, adminMiddleware, feedbacksController.getAll);
router.post('/', feedbackLimiter, validate(feedbackCreateSchema), feedbacksController.create);
router.put('/:id/read', authMiddleware, adminMiddleware, feedbacksController.markRead);
router.put('/:id/publish', authMiddleware, adminMiddleware, feedbacksController.publish);
router.post('/:id/like', authMiddleware, feedbacksController.toggleLike);
router.delete('/:id', authMiddleware, adminMiddleware, feedbacksController.remove);

module.exports = router;
