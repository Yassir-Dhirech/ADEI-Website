import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import env from '../config/env';
import { AuthUserPayload } from '../types/express';

export const JWT_SECRET = env.JWT_SECRET;

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void | Response => {
  try {
    const cookieToken = req.cookies?.adei_token as string | undefined;
    const authHeader = req.headers.authorization;
    const headerToken = authHeader
      ? (authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader)
      : null;

    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Accès non autorisé' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token invalide' });
  }
};

export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void | Response => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Accès administrateur requis' });
  }
};
