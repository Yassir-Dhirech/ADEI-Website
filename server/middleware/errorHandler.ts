import multer from 'multer';
import { Request, Response, NextFunction, RequestHandler } from 'express';

interface HttpError extends Error {
  type?: string;
  status?: number;
}

export const handleApiError = (error: Error, context = '') => {
  console.error(`API Error in ${context}:`, {
    message: error.message,
    stack: error.stack,
    name: error.name
  });

  return {
    success: false,
    message: 'Service temporairement indisponible. Veuillez réessayer plus tard.',
    code: 'SERVICE_ERROR'
  };
};

export const asyncWrapper = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error: Error) => {
      const context = `${req.method} ${req.path}`;
      const errorResponse = handleApiError(error, context);
      res.status(500).json(errorResponse);
    });
  };
};

export const errorMiddleware = (err: HttpError, req: Request, res: Response, _next: NextFunction): Response => {
  if (err instanceof multer.MulterError || (err.message && err.message.includes('Seules les images'))) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Erreur lors du téléchargement du fichier',
      code: 'UPLOAD_ERROR'
    });
  }
  if (err.type === 'entity.parse.failed' || err.status === 400) {
    return res.status(400).json({
      success: false,
      message: 'Requête JSON invalide',
      code: 'BAD_REQUEST'
    });
  }
  const context = `${req.method} ${req.path}`;
  const errorResponse = handleApiError(err, context);
  return res.status(500).json(errorResponse);
};

export const notFoundMiddleware = (_req: Request, res: Response): Response => {
  return res.status(404).json({
    success: false,
    message: 'Endpoint non trouvé',
    code: 'NOT_FOUND'
  });
};
