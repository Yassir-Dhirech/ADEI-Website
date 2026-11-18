import { Request, Response } from 'express';
import * as service from '../services/academic.service';
import { sendSuccess, sendError } from '../utils/response';

export const getTree = async (_req: Request, res: Response) => {
  const data = await service.getAcademicTree();
  return sendSuccess(res, data);
};

export const updateYear = async (req: Request, res: Response) => {
  const year = await service.updateYear(String(req.params.id), req.body);
  if (!year) return sendError(res, 404, 'NOT_FOUND', 'Année non trouvée');
  return sendSuccess(res, year, { message: 'Année mise à jour' });
};

export const updateSection = async (req: Request, res: Response) => {
  const sec = await service.updateSection(String(req.params.id), req.body);
  if (!sec) return sendError(res, 404, 'NOT_FOUND', 'Section non trouvée');
  return sendSuccess(res, sec, { message: 'Section mise à jour' });
};
