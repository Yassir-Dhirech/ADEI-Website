import { Request, Response } from 'express';
import * as partnersService from '../services/partners.service';
import { sendSuccess, sendError } from '../utils/response';

export const getAll = async (_req: Request, res: Response) => {
  try {
    const data = await partnersService.listPartners();
    return sendSuccess(res, data, { meta: { total: data.length } });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la récupération des partenaires');
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const partner = await partnersService.createPartner(req.body, req.file);
    return sendSuccess(res, partner, { status: 201, message: 'Partenaire créé avec succès!' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la création du partenaire - Veuillez réessayer');
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const partner = await partnersService.updatePartner(String(req.params.id), req.body, req.file);
    if (!partner) return sendError(res, 404, 'NOT_FOUND', 'Partenaire non trouvé - Impossible de modifier ce partenaire');
    return sendSuccess(res, partner, { message: 'Partenaire modifié avec succès!' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la mise à jour du partenaire - Veuillez réessayer');
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const ok = await partnersService.deletePartner(String(req.params.id));
    if (!ok) return sendError(res, 404, 'NOT_FOUND', 'Partenaire non trouvé');
    return sendSuccess(res, null, { message: 'Partenaire supprimé' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la suppression du partenaire');
  }
};

export const reorder = async (req: Request, res: Response) => {
  try {
    const result = await partnersService.reorderPartner(String(req.params.id), String(req.body?.direction || ''));
    if (result.notFound) return sendError(res, 404, 'NOT_FOUND', 'Partenaire non trouvé');
    const message = result.unchanged ? 'Aucun changement nécessaire' : 'Ordre modifié avec succès';
    return sendSuccess(res, null, { message });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la modification de l'ordre");
  }
};
