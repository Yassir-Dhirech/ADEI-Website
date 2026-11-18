import { Request, Response } from 'express';
import * as eventsService from '../services/events.service';
import { sendSuccess, sendError } from '../utils/response';

export const getAll = async (req: Request, res: Response) => {
  const { data, meta } = await eventsService.listEvents(req.query as Record<string, unknown>);
  return sendSuccess(res, data, { meta: { ...meta } });
};

export const create = async (req: Request, res: Response) => {
  try {
    const event = await eventsService.createEvent(req.body, req.files);
    return sendSuccess(res, event, { status: 201, message: 'Événement créé avec succès!' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return sendError(res, 500, 'SERVER_ERROR', `Erreur lors de la création de l'événement: ${msg}`);
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const event = await eventsService.updateEvent(String(req.params.id), req.body, req.files);
    if (!event) return sendError(res, 404, 'NOT_FOUND', 'Événement non trouvé');
    return sendSuccess(res, event, { message: 'Événement modifié avec succès!' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la mise à jour de l'événement");
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const ok = await eventsService.deleteEvent(String(req.params.id));
    if (!ok) return sendError(res, 404, 'NOT_FOUND', 'Événement non trouvé');
    return sendSuccess(res, null, { message: 'Événement supprimé' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la suppression de l'événement");
  }
};

export const reorder = async (req: Request, res: Response) => {
  try {
    const result = await eventsService.reorderEvent(String(req.params.id), String(req.body?.direction || ''));
    if (result.notFound) return sendError(res, 404, 'NOT_FOUND', 'Événement non trouvé');
    const message = result.unchanged ? 'Aucun changement nécessaire' : 'Ordre modifié avec succès';
    return sendSuccess(res, null, { message });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la modification de l'ordre");
  }
};
