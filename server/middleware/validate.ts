import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodTypeAny } from 'zod';
import { sendError } from '../utils/response';

export const validate = (schema: ZodTypeAny): RequestHandler => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = schema.safeParse(req.body || {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
    return sendError(res, 400, 'VALIDATION_ERROR', 'Données invalides', details);
  }
  req.body = result.data;
  next();
};
