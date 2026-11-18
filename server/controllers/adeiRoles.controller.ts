import { Request, Response } from 'express';
import * as service from '../services/adeiRoles.service';
import { sendSuccess, sendError } from '../utils/response';

export const getAll = async (_req: Request, res: Response) => {
  const data = await service.listRoles();
  return sendSuccess(res, data, { meta: { total: data.length } });
};

export const create = async (req: Request, res: Response) => {
  const role = await service.createRole(req.body);
  return sendSuccess(res, role, { status: 201, message: 'Rôle créé avec succès!' });
};

export const update = async (req: Request, res: Response) => {
  const role = await service.updateRole(String(req.params.id), req.body);
  if (!role) return sendError(res, 404, 'NOT_FOUND', 'Rôle non trouvé');
  return sendSuccess(res, role, { message: 'Rôle modifié avec succès!' });
};

export const remove = async (req: Request, res: Response) => {
  const ok = await service.deleteRole(String(req.params.id));
  if (!ok) return sendError(res, 404, 'NOT_FOUND', 'Rôle non trouvé');
  return sendSuccess(res, null, { message: 'Rôle supprimé' });
};
