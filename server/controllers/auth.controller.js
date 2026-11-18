const authService = require('../services/auth.service');
const env = require('../config/env');
const { sendSuccess, sendError } = require('../utils/response');

const AUTH_COOKIE_NAME = 'adei_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.authenticate(email, password);
    if (!result) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Identifiants invalides');
    }

    res.cookie(AUTH_COOKIE_NAME, result.token, COOKIE_OPTIONS);
    return sendSuccess(res, { token: result.token, user: result.user }, { message: 'Connexion réussie' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur serveur');
  }
};

exports.logout = (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax'
  });
  return sendSuccess(res, null, { message: 'Déconnexion réussie' });
};
