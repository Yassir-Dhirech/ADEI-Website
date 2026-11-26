import { Request, Response, CookieOptions } from 'express';
import * as authService from '../services/auth.service';
import * as otpService from '../services/otp.service';
import env from '../config/env';
import { sendSuccess, sendError } from '../utils/response';
import { logAction } from '../services/audit.service';

const AUTH_COOKIE_NAME = 'adei_token';
const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.authenticate(email, password);
    if (!result.success) {
      await logAction({
        action: 'LOGIN_FAILURE',
        resourceType: 'auth',
        details: { email: String(email || '').trim().toLowerCase(), reason: result.code },
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null
      });

      if (result.code === 'ACCOUNT_PENDING') {
        return sendError(
          res,
          403,
          'ACCOUNT_PENDING',
          "Votre compte est en cours de validation par le bureau ADEI. Vous recevrez l'accès dès son approbation."
        );
      }
      if (result.code === 'ACCOUNT_REJECTED') {
        return sendError(
          res,
          403,
          'ACCOUNT_REJECTED',
          "Votre demande d'inscription a été refusée par le bureau ADEI."
        );
      }
      return sendError(res, 401, 'UNAUTHORIZED', 'Identifiants invalides');
    }

    await logAction({
      userId: result.user.id,
      actorEmail: result.user.email,
      actorRole: result.user.role,
      action: 'LOGIN_SUCCESS',
      resourceType: 'auth',
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    res.cookie(AUTH_COOKIE_NAME, result.token, COOKIE_OPTIONS);
    return sendSuccess(res, { token: result.token, user: result.user }, { message: 'Connexion réussie' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur serveur');
  }
};

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const result = await otpService.generateAndSendOtp(email);
    return sendSuccess(res, { devOtp: result.devOtp }, { message: result.message });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de l'envoi du code de vérification");
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    // Vérification préalable du code OTP
    const isValidOtp = await otpService.verifyOtpCode(email, otp);
    if (!isValidOtp) {
      return sendError(res, 400, 'INVALID_OTP', 'Code de vérification OTP invalide ou expiré (durée de validité : 10 minutes).');
    }

    const result = await authService.register(req.body);
    if (!result.success) {
      if (result.code === 'EMAIL_EXISTS') {
        return sendError(res, 409, 'EMAIL_EXISTS', 'Un compte avec cette adresse email existe déjà');
      }
      if (result.code === 'USERNAME_EXISTS') {
        return sendError(res, 409, 'USERNAME_EXISTS', "Ce nom d'utilisateur est déjà utilisé");
      }
      return sendError(res, 400, 'BAD_REQUEST', "Erreur lors de l'inscription");
    }

    return sendSuccess(
      res,
      result.user,
      {
        status: 201,
        message: "Demande d'inscription enregistrée avec succès ! Votre compte sera activé après validation par le bureau ADEI."
      }
    );
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur serveur lors de l'inscription");
  }
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax'
  });
  return sendSuccess(res, null, { message: 'Déconnexion réussie' });
};
