const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const { loginSchema } = require('../validators/schemas');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, message: 'Trop de tentatives de connexion, veuillez réessayer plus tard.', code: 'RATE_LIMITED', error: { code: 'RATE_LIMITED', message: 'Trop de tentatives de connexion, veuillez réessayer plus tard.' } }
});

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);

module.exports = router;
