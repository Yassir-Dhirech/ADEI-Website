const express = require('express');
const router = express.Router();

const partnersController = require('../controllers/partners.controller');
const { upload, validateUploadedFiles } = require('../config/upload');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { partnerCreateSchema, partnerUpdateSchema } = require('../validators/schemas');

router.get('/', partnersController.getAll);
router.post('/', authMiddleware, adminMiddleware, upload.single('logo'), validateUploadedFiles, validate(partnerCreateSchema), partnersController.create);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('logo'), validateUploadedFiles, validate(partnerUpdateSchema), partnersController.update);
router.delete('/:id', authMiddleware, adminMiddleware, partnersController.remove);
router.patch('/:id/reorder', authMiddleware, adminMiddleware, partnersController.reorder);

module.exports = router;
