const express = require('express');
const router = express.Router();

const eventsController = require('../controllers/events.controller');
const { upload, validateUploadedFiles } = require('../config/upload');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { asyncWrapper } = require('../middleware/errorHandler');

const eventUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 }
]);

router.get('/', asyncWrapper(eventsController.getAll));
router.post('/', authMiddleware, adminMiddleware, eventUpload, validateUploadedFiles, eventsController.create);
router.put('/:id', authMiddleware, adminMiddleware, eventUpload, validateUploadedFiles, eventsController.update);
router.delete('/:id', authMiddleware, adminMiddleware, eventsController.remove);
router.patch('/:id/reorder', authMiddleware, adminMiddleware, eventsController.reorder);

module.exports = router;