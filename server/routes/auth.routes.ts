import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema, sendOtpSchema } from '../validators/schemas';

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

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: "Trop de demandes d'OTP, veuillez patienter quelques minutes.",
    code: 'RATE_LIMITED',
    error: { code: 'RATE_LIMITED', message: "Trop de demandes d'OTP, veuillez patienter quelques minutes." }
  }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: "Trop de tentatives d'inscription, veuillez réessayer plus tard.",
    code: 'RATE_LIMITED',
    error: { code: 'RATE_LIMITED', message: "Trop de tentatives d'inscription, veuillez réessayer plus tard." }
  }
});

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/send-otp', otpLimiter, validate(sendOtpSchema), authController.sendOtp);
router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/logout', authController.logout);

export default router;
