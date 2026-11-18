const express = require('express');
const router = express.Router();

const filieresController = require('../controllers/filieres.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { asyncWrapper } = require('../middleware/errorHandler');

router.get('/', asyncWrapper(filieresController.getAll));
router.post('/', authMiddleware, adminMiddleware, filieresController.create);
router.put('/:id', authMiddleware, adminMiddleware, filieresController.update);
router.delete('/:id', authMiddleware, adminMiddleware, filieresController.remove);

module.exports = router;