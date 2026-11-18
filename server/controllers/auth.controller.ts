import { Request, Response, CookieOptions } from 'express';
import * as authService from '../services/auth.service';
import env from '../config/env';
import { sendSuccess, sendError } from '../utils/response';

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
    if (!result) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Identifiants invalides');
    }

    res.cookie(AUTH_COOKIE_NAME, result.token, COOKIE_OPTIONS);
    return sendSuccess(res, { token: result.token, user: result.user }, { message: 'Connexion réussie' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur serveur');
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
