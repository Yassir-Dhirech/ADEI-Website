const express = require('express');
const router = express.Router();
const controller = require('../controllers/academic.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { asyncWrapper } = require('../middleware/errorHandler');

router.get('/', asyncWrapper(controller.getTree));
router.put('/years/:id', authMiddleware, adminMiddleware, asyncWrapper(controller.updateYear));
router.put('/sections/:id', authMiddleware, adminMiddleware, asyncWrapper(controller.updateSection));

module.exports = router;