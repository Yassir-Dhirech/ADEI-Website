const express = require('express');
const router = express.Router();

const membersController = require('../controllers/adeiMembers.controller');
const { upload, validateUploadedFiles } = require('../config/upload');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { adeiMemberCreateSchema, adeiMemberUpdateSchema } = require('../validators/schemas');

router.get('/', membersController.getAll);
router.post('/', authMiddleware, adminMiddleware, upload.single('photo'), validateUploadedFiles, validate(adeiMemberCreateSchema), membersController.create);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('photo'), validateUploadedFiles, validate(adeiMemberUpdateSchema), membersController.update);
router.delete('/:id', authMiddleware, adminMiddleware, membersController.remove);

module.exports = router;
