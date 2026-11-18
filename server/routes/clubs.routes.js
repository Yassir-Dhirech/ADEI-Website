const express = require('express');
const router = express.Router();

const clubsController = require('../controllers/clubs.controller');
const { upload, validateUploadedFiles } = require('../config/upload');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { asyncWrapper } = require('../middleware/errorHandler');

router.get('/', asyncWrapper(clubsController.getAll));
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), validateUploadedFiles, clubsController.create);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), validateUploadedFiles, clubsController.update);
router.delete('/:id', authMiddleware, adminMiddleware, clubsController.remove);

module.exports = router;