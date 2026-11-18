import { Request, Response } from 'express';
import * as newsService from '../services/news.service';
import { sendSuccess, sendError } from '../utils/response';

export const getAll = async (req: Request, res: Response) => {
  const { data, meta } = await newsService.listNews(req.query as Record<string, unknown>);
  return sendSuccess(res, data, { meta: { ...meta } });
};

export const create = async (req: Request, res: Response) => {
  try {
    const news = await newsService.createNews(req.body, req.files);
    return sendSuccess(res, news, { status: 201, message: 'Actualité créée avec succès!' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return sendError(res, 500, 'SERVER_ERROR', `Erreur lors de la création de l'actualité: ${msg}`);
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const news = await newsService.updateNews(String(req.params.id), req.body, req.files);
    if (!news) return sendError(res, 404, 'NOT_FOUND', 'Actualité non trouvée');
    return sendSuccess(res, news, { message: 'Actualité modifiée avec succès!' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la mise à jour de l'actualité");
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const ok = await newsService.deleteNews(String(req.params.id));
    if (!ok) return sendError(res, 404, 'NOT_FOUND', 'Actualité non trouvée');
    return sendSuccess(res, null, { message: 'Actualité supprimée' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la suppression de l'actualité");
  }
};

export const reorder = async (req: Request, res: Response) => {
  try {
    const result = await newsService.reorderNews(String(req.params.id), String(req.body?.direction || ''));
    if (result.notFound) return sendError(res, 404, 'NOT_FOUND', 'Actualité non trouvée');
    const message = result.unchanged ? 'Aucun changement nécessaire' : 'Ordre modifié avec succès';
    return sendSuccess(res, null, { message });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la modification de l'ordre");
  }
};
