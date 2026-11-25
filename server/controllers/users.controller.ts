import { Request, Response } from 'express';
import * as usersService from '../services/users.service';
import { sendSuccess, sendError } from '../utils/response';

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id || req.user!.userId!;
    const user = await usersService.getProfile(userId);
    if (!user) return sendError(res, 404, 'NOT_FOUND', 'Utilisateur non trouvé');
    return sendSuccess(res, user);
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la récupération du profil utilisateur');
  }
};

export const getPasswordSecurity = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id || req.user!.userId!;
    const user = await usersService.getPasswordSecurity(userId);
    if (!user) return sendError(res, 404, 'NOT_FOUND', 'Utilisateur non trouvé');
    return sendSuccess(res, { lastPasswordChange: user.lastPasswordChange });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la récupération des informations de sécurité');
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id || req.user!.userId!;
    const result = await usersService.changePassword(userId, currentPassword, newPassword);
    if (!result.ok) {
      return sendError(res, result.status, result.status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST', result.message || 'Erreur');
    }
    return sendSuccess(res, null, { message: 'Mot de passe modifié avec succès' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la modification du mot de passe');
  }
};

export const getAll = async (_req: Request, res: Response) => {
  try {
    const users = await usersService.listUsers();
    return sendSuccess(res, users, { meta: { total: users.length } });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la récupération des utilisateurs');
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const result = await usersService.createUser(req.body);
    if (result.conflict) return sendError(res, 400, 'CONFLICT', "Ce nom d'utilisateur ou cet email existe déjà");
    return sendSuccess(res, result.user, { status: 201, message: 'Utilisateur créé avec succès!' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la création de l'utilisateur");
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const user = await usersService.updateUser(String(req.params.id), req.body);
    if (!user) return sendError(res, 404, 'NOT_FOUND', 'Utilisateur non trouvé');
    return sendSuccess(res, user, { message: 'Utilisateur modifié avec succès!' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la mise à jour de l'utilisateur");
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const result = await usersService.deleteUser(String(req.params.id));
    if (result.lastAdmin) return sendError(res, 400, 'BAD_REQUEST', 'Impossible de supprimer le dernier administrateur');
    if (!result.deleted) return sendError(res, 404, 'NOT_FOUND', 'Utilisateur non trouvé');
    return sendSuccess(res, null, { message: 'Utilisateur supprimé' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la suppression de l'utilisateur");
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { status, role, is_president, is_representant } = req.body;
    if (!status || !['active', 'rejected', 'pending'].includes(status)) {
      return sendError(res, 400, 'BAD_REQUEST', 'Statut invalide (active, rejected ou pending)');
    }

    const user = await usersService.updateUser(String(req.params.id), {
      status,
      ...(role ? { role } : {}),
      ...(typeof is_president === 'boolean' ? { is_president } : {}),
      ...(typeof is_representant === 'boolean' ? { is_representant } : {})
    });

    if (!user) return sendError(res, 404, 'NOT_FOUND', 'Utilisateur non trouvé');
    return sendSuccess(res, user, { message: `Compte mis à jour avec succès : ${status}` });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la mise à jour du statut");
  }
};