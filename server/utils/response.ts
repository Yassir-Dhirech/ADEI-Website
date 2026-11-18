import { Response } from 'express';

export interface SuccessOptions {
  status?: number;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ErrorDetail {
  field?: string;
  message: string;
}

export function sendSuccess<T>(res: Response, data: T, options: SuccessOptions = {}): Response {
  const { status = 200, message, meta } = options;
  const payload: Record<string, unknown> = { success: true, data };
  if (message) payload.message = message;
  if (meta) payload.meta = meta;
  return res.status(status).json(payload);
}

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: ErrorDetail[]
): Response {
  const error: Record<string, unknown> = { code, message };
  if (details) error.details = details;
  return res.status(status).json({
    success: false,
    data: null,
    message,
    code,
    error
  });
}
