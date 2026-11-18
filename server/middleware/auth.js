const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

const authMiddleware = (req, res, next) => {
  try {
    const cookieToken = req.cookies && req.cookies.adei_token;
    const authHeader = req.headers.authorization;
    const headerToken = authHeader
      ? (authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader)
      : null;

    // Priorité au cookie httpOnly, fallback sur le header Authorization (tests/CLI)
    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Accès non autorisé' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalide' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Accès administrateur requis' });
  }
};

module.exports = { authMiddleware, adminMiddleware, JWT_SECRET };
