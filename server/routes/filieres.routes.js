const express = require('express');
const router = express.Router();

const filieresController = require('../controllers/filieres.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { asyncWrapper } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validate');
const { filiereCreateSchema, filiereUpdateSchema } = require('../validators/schemas');

router.get('/', asyncWrapper(filieresController.getAll));
router.post('/', authMiddleware, adminMiddleware, validate(filiereCreateSchema), filieresController.create);
router.put('/:id', authMiddleware, adminMiddleware, validate(filiereUpdateSchema), filieresController.update);
router.delete('/:id', authMiddleware, adminMiddleware, filieresController.remove);

module.exports = router;
