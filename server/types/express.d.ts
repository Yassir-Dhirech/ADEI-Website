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
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer?: Buffer;
      }
    }
  }
}