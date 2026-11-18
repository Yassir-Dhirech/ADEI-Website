const express = require('express');
const router = express.Router();

const clubsController = require('../controllers/clubs.controller');
const { upload, validateUploadedFiles } = require('../config/upload');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { asyncWrapper } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validate');
const { clubCreateSchema, clubUpdateSchema } = require('../validators/schemas');

router.get('/', asyncWrapper(clubsController.getAll));
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), validateUploadedFiles, validate(clubCreateSchema), clubsController.create);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), validateUploadedFiles, validate(clubUpdateSchema), clubsController.update);
router.delete('/:id', authMiddleware, adminMiddleware, clubsController.remove);

module.exports = router;
