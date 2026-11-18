const express = require('express');
const router = express.Router();

const newsController = require('../controllers/news.controller');
const { upload, validateUploadedFiles } = require('../config/upload');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { asyncWrapper } = require('../middleware/errorHandler');

const newsUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 }
]);

router.get('/', asyncWrapper(newsController.getAll));
router.post('/', authMiddleware, adminMiddleware, newsUpload, validateUploadedFiles, newsController.create);
router.put('/:id', authMiddleware, adminMiddleware, newsUpload, validateUploadedFiles, newsController.update);
router.delete('/:id', authMiddleware, adminMiddleware, newsController.remove);
router.patch('/:id/reorder', authMiddleware, adminMiddleware, newsController.reorder);

module.exports = router;