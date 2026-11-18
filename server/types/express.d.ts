export interface AuthUserPayload {
  id: number;
  userId?: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}