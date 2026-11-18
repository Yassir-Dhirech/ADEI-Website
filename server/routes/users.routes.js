const express = require('express');
const router = express.Router();

const usersController = require('../controllers/users.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/me', authMiddleware, usersController.getMe);
router.get('/password-security', authMiddleware, usersController.getPasswordSecurity);
router.post('/change-password', authMiddleware, usersController.changePassword);

router.get('/', authMiddleware, adminMiddleware, usersController.getAll);
router.post('/', authMiddleware, adminMiddleware, usersController.create);
router.put('/:id', authMiddleware, adminMiddleware, usersController.update);
router.delete('/:id', authMiddleware, adminMiddleware, usersController.remove);

module.exports = router;