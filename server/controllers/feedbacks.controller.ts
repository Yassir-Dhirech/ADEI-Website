import { Request, Response } from 'express';
import * as feedbacksService from '../services/feedbacks.service';
import { sendSuccess, sendError } from '../utils/response';

export const getPublic = async (req: Request, res: Response) => {
  const { data, meta } = await feedbacksService.listPublicFeedbacks(req.query as Record<string, unknown>);
  return sendSuccess(res, data, { meta: { ...meta } });
};

export const getAll = async (req: Request, res: Response) => {
  try {
    const { data, meta } = await feedbacksService.listAllFeedbacks(req.query as Record<string, unknown>);
    return sendSuccess(res, data, { meta: { ...meta } });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la récupération des feedbacks');
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const cookieToken = req.cookies?.adei_token as string | undefined;
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const feedback = await feedbacksService.createFeedback(req.body, cookieToken || headerToken);
    return sendSuccess(res, feedback, { status: 201, message: 'Votre feedback a été envoyé avec succès!' });
  } catch (error) {
    console.error('[Feedbacks create error]:', error);
    const msg = error instanceof Error ? error.message : "Erreur lors de l'envoi du feedback";
    return sendError(res, 500, 'SERVER_ERROR', `Erreur lors de l'envoi du feedback: ${msg}`);
  }
};

export const markRead = async (req: Request, res: Response) => {
  try {
    const feedback = await feedbacksService.markAsRead(String(req.params.id));
    if (!feedback) return sendError(res, 404, 'NOT_FOUND', 'Feedback non trouvé');
    return sendSuccess(res, feedback);
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la mise à jour du feedback');
  }
};

export const publish = async (req: Request, res: Response) => {
  try {
    const feedback = await feedbacksService.setPublished(String(req.params.id), req.body?.isPublished);
    if (!feedback) return sendError(res, 404, 'NOT_FOUND', 'Feedback non trouvé');
    return sendSuccess(res, feedback);
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la modération du feedback');
  }
};

export const toggleLike = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id || req.user!.userId!;
    const result = await feedbacksService.toggleLike(String(req.params.id), userId);
    return sendSuccess(res, result);
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors du like');
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const ok = await feedbacksService.deleteFeedback(String(req.params.id));
    if (!ok) return sendError(res, 404, 'NOT_FOUND', 'Feedback non trouvé');
    return sendSuccess(res, null, { message: 'Feedback supprimé' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la suppression du feedback');
  }
};
