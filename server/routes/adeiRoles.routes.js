const express = require('express');
const router = express.Router();
const controller = require('../controllers/adeiRoles.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { asyncWrapper } = require('../middleware/errorHandler');

router.get('/', asyncWrapper(controller.getAll));
router.post('/', authMiddleware, adminMiddleware, asyncWrapper(controller.create));
router.put('/:id', authMiddleware, adminMiddleware, asyncWrapper(controller.update));
router.delete('/:id', authMiddleware, adminMiddleware, asyncWrapper(controller.remove));

module.exports = router;