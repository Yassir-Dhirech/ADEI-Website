const authService = require('../services/auth.service');
const env = require('../config/env');

const AUTH_COOKIE_NAME = 'adei_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    const result = await authService.authenticate(email, password);
    if (!result) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    res.cookie(AUTH_COOKIE_NAME, result.token, COOKIE_OPTIONS);
    res.json({ success: true, token: result.token, user: result.user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax'
  });
  res.json({ success: true });
};