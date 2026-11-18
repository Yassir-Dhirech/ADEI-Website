import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { loginSchema } from '../validators/schemas';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Trop de tentatives de connexion, veuillez réessayer plus tard.',
    code: 'RATE_LIMITED',
    error: { code: 'RATE_LIMITED', message: 'Trop de tentatives de connexion, veuillez réessayer plus tard.' }
  }
});

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);

export default router;
