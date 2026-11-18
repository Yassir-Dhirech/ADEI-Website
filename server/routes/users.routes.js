const express = require('express');
const router = express.Router();

const usersController = require('../controllers/users.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { changePasswordSchema, createUserSchema, updateUserSchema } = require('../validators/schemas');

router.get('/me', authMiddleware, usersController.getMe);
router.get('/password-security', authMiddleware, usersController.getPasswordSecurity);
router.post('/change-password', authMiddleware, validate(changePasswordSchema), usersController.changePassword);

router.get('/', authMiddleware, adminMiddleware, usersController.getAll);
router.post('/', authMiddleware, adminMiddleware, validate(createUserSchema), usersController.create);
router.put('/:id', authMiddleware, adminMiddleware, validate(updateUserSchema), usersController.update);
router.delete('/:id', authMiddleware, adminMiddleware, usersController.remove);

module.exports = router;
