import { Request, Response } from 'express';
import * as clubsService from '../services/clubs.service';
import { sendSuccess, sendError } from '../utils/response';

export const getAll = async (_req: Request, res: Response) => {
  const data = await clubsService.listClubs();
  return sendSuccess(res, data, { meta: { total: data.length } });
};

export const create = async (req: Request, res: Response) => {
  try {
    const club = await clubsService.createClub(req.body, req.file);
    return sendSuccess(res, club, { status: 201, message: 'Club créé avec succès!' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la création du club - Veuillez réessayer');
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const club = await clubsService.updateClub(String(req.params.id), req.body, req.file);
    if (!club) return sendError(res, 404, 'NOT_FOUND', 'Club non trouvé - Impossible de modifier ce club');
    return sendSuccess(res, club, { message: 'Club modifié avec succès!' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la mise à jour du club - Veuillez réessayer');
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const ok = await clubsService.deleteClub(String(req.params.id));
    if (!ok) return sendError(res, 404, 'NOT_FOUND', 'Club non trouvé');
    return sendSuccess(res, null, { message: 'Club supprimé avec succès!' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la suppression du club');
  }
};
