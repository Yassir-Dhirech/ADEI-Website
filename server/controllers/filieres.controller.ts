import { Request, Response } from 'express';
import * as filieresService from '../services/filieres.service';
import { sendSuccess, sendError } from '../utils/response';

export const getAll = async (_req: Request, res: Response) => {
  const data = await filieresService.listFilieres();
  return sendSuccess(res, data, { meta: { total: data.length } });
};

export const create = async (req: Request, res: Response) => {
  try {
    const filiere = await filieresService.createFiliere(req.body);
    return sendSuccess(res, filiere, { status: 201, message: 'Filière créée avec succès!' });
  } catch (error: unknown) {
    const err = error as { name?: string; errors?: Array<{ message: string }> };
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 400, 'CONFLICT', 'Cette abréviation existe déjà. Veuillez choisir une autre abréviation.');
    }
    if (err?.name === 'SequelizeValidationError' && err.errors) {
      return sendError(res, 400, 'VALIDATION_ERROR', `Erreur de validation: ${err.errors.map((e) => e.message).join(', ')}`);
    }
    console.error('[filieres.controller.create error]:', error);
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la création de la filière - Veuillez réessayer');
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const filiere = await filieresService.updateFiliere(String(req.params.id), req.body);
    if (!filiere) return sendError(res, 404, 'NOT_FOUND', 'Filière non trouvée - Impossible de modifier cette filière');
    return sendSuccess(res, filiere, { message: 'Filière modifiée avec succès!' });
  } catch (error: unknown) {
    const err = error as { name?: string; errors?: Array<{ message: string }> };
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 400, 'CONFLICT', 'Cette abréviation existe déjà. Veuillez choisir une autre abréviation.');
    }
    if (err?.name === 'SequelizeValidationError' && err.errors) {
      return sendError(res, 400, 'VALIDATION_ERROR', `Erreur de validation: ${err.errors.map((e) => e.message).join(', ')}`);
    }
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la mise à jour de la filière - Veuillez réessayer');
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const ok = await filieresService.deleteFiliere(String(req.params.id));
    if (!ok) return sendError(res, 404, 'NOT_FOUND', 'Filière non trouvée');
    return sendSuccess(res, null, { message: 'Filière supprimée' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la suppression de la filière');
  }
};
