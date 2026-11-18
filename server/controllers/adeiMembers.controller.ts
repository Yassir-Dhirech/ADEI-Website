import { Request, Response } from 'express';
import * as membersService from '../services/adeiMembers.service';
import { sendSuccess, sendError } from '../utils/response';

export const getAll = async (_req: Request, res: Response) => {
  try {
    const data = await membersService.listMembers();
    return sendSuccess(res, data, { meta: { total: data.length } });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la récupération des membres ADEI');
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const member = await membersService.createMember(req.body, req.file);
    return sendSuccess(res, member, { status: 201, message: 'Membre ADEI créé avec succès!' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la création du membre ADEI');
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const member = await membersService.updateMember(String(req.params.id), req.body, req.file);
    if (!member) return sendError(res, 404, 'NOT_FOUND', 'Membre ADEI non trouvé');
    return sendSuccess(res, member, { message: 'Membre ADEI modifié avec succès!' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la mise à jour du membre ADEI');
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const ok = await membersService.deleteMember(String(req.params.id));
    if (!ok) return sendError(res, 404, 'NOT_FOUND', 'Membre ADEI non trouvé');
    return sendSuccess(res, null, { message: 'Membre ADEI supprimé' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la suppression du membre ADEI');
  }
};
