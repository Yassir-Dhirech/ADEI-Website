const express = require('express');
const router = express.Router();

const membersController = require('../controllers/adeiMembers.controller');
const { upload, validateUploadedFiles } = require('../config/upload');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/', membersController.getAll);
router.post('/', authMiddleware, adminMiddleware, upload.single('photo'), validateUploadedFiles, membersController.create);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('photo'), validateUploadedFiles, membersController.update);
router.delete('/:id', authMiddleware, adminMiddleware, membersController.remove);

module.exports = router;