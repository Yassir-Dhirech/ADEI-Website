const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const feedbacksController = require('../controllers/feedbacks.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { asyncWrapper } = require('../middleware/errorHandler');

const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de feedbacks envoyés, veuillez réessayer plus tard.' }
});

router.get('/public', asyncWrapper(feedbacksController.getPublic));
router.get('/', authMiddleware, adminMiddleware, feedbacksController.getAll);
router.post('/', feedbackLimiter, feedbacksController.create);
router.put('/:id/read', authMiddleware, adminMiddleware, feedbacksController.markRead);
router.put('/:id/publish', authMiddleware, adminMiddleware, feedbacksController.publish);
router.delete('/:id', authMiddleware, adminMiddleware, feedbacksController.remove);
router.post('/:id/like', authMiddleware, feedbacksController.toggleLike);


module.exports = router;