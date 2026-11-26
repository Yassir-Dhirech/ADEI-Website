import { Request, Response } from 'express';
import * as clubsService from '../services/clubs.service';
import { Club } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { logAction } from '../services/audit.service';

export const getAll = async (_req: Request, res: Response) => {
  try {
    const data = await clubsService.listClubs();
    return sendSuccess(res, data, { meta: { total: data.length } });
  } catch (err) {
    console.error('[clubs.controller.getAll error]:', err);
    return sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur lors de la récupération des clubs');
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const club = await clubsService.createClub(req.body, req.file);
    return sendSuccess(res, club, { status: 201, message: 'Club créé avec succès!' });
  } catch (err) {
    console.error('[clubs.controller.create error]:', err);
    return sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur lors de la création du club - Veuillez réessayer');
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
    const clubId = String(req.params.id);
    const existing = await Club.findByPk(clubId);
    const ok = await clubsService.deleteClub(clubId);
    if (!ok) return sendError(res, 404, 'NOT_FOUND', 'Club non trouvé');

    const adminId = req.user?.id || req.user?.userId;
    await logAction({
      userId: adminId ? Number(adminId) : null,
      actorEmail: req.user?.email || null,
      actorRole: req.user?.role || 'admin',
      action: 'CLUB_DELETE',
      resourceType: 'club',
      resourceId: clubId,
      details: { clubName: existing?.club || `Club #${clubId}` },
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    return sendSuccess(res, null, { message: 'Club supprimé avec succès!' });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la suppression du club');
  }
};

import {
  notifyAdminClubUpdateSubmission,
  notifyPresidentClubUpdateDecision
} from '../services/notification.service';

export const getMyClub = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id || req.user!.userId!;
    const club = await clubsService.findClubForUser(userId);
    if (!club) {
      return sendError(res, 404, 'NOT_FOUND', "Aucun club n'est actuellement rattaché à votre compte");
    }
    return sendSuccess(res, club);
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la récupération de votre club');
  }
};

export const proposeUpdate = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id || req.user!.userId!;
    const isAdmin = req.user!.role === 'admin';
    const clubId = String(req.params.id);

    if (!isAdmin) {
      const userClub = await clubsService.findClubForUser(userId);
      if (!userClub || String(userClub.id) !== clubId) {
        return sendError(res, 403, 'FORBIDDEN', "Vous n'avez pas l'autorisation de modifier ce club");
      }
    }

    const result = await clubsService.proposeClubUpdate(clubId, userId, req.body, req.file);
    if (!result.ok) {
      return sendError(res, result.status || 400, 'BAD_REQUEST', result.message || 'Action non autorisée');
    }

    if (result.club && req.user) {
      void notifyAdminClubUpdateSubmission({
        clubName: result.club.club,
        presidentName: req.user.username || 'Président de Club',
        presidentEmail: req.user.email || ''
      });
    }

    return sendSuccess(res, result.club, {
      message: "Modifications enregistrées et transmises au bureau ADEI pour validation."
    });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la soumission des modifications');
  }
};

export const approveUpdate = async (req: Request, res: Response) => {
  try {
    const clubId = String(req.params.id);
    const result = await clubsService.approveClubUpdate(clubId);
    if (!result.ok) {
      return sendError(res, result.status || 400, 'BAD_REQUEST', result.message || 'Erreur');
    }

    if (result.presidentUser && result.club) {
      void notifyPresidentClubUpdateDecision({
        presidentEmail: result.presidentUser.email,
        presidentName: result.presidentUser.username,
        clubName: result.club.club,
        decision: 'approved'
      });
    }

    const currentAdminId = req.user?.id || req.user?.userId;
    await logAction({
      userId: currentAdminId ? Number(currentAdminId) : null,
      actorEmail: req.user?.email || null,
      actorRole: req.user?.role || 'admin',
      action: 'CLUB_PROPOSAL_APPROVE',
      resourceType: 'club',
      resourceId: clubId,
      details: {
        clubName: result.club?.club,
        approvedBy: currentAdminId
      },
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    return sendSuccess(res, result.club, {
      message: 'Modifications validées et publiées sur la fiche officielle du club !'
    });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la validation des modifications');
  }
};

export const rejectUpdate = async (req: Request, res: Response) => {
  try {
    const clubId = String(req.params.id);
    const { reason } = req.body;
    const result = await clubsService.rejectClubUpdate(clubId);
    if (!result.ok) {
      return sendError(res, result.status || 400, 'BAD_REQUEST', result.message || 'Erreur');
    }

    if (result.presidentUser && result.club) {
      void notifyPresidentClubUpdateDecision({
        presidentEmail: result.presidentUser.email,
        presidentName: result.presidentUser.username,
        clubName: result.club.club,
        decision: 'rejected',
        rejectionReason: reason
      });
    }

    const currentAdminId = req.user?.id || req.user?.userId;
    await logAction({
      userId: currentAdminId ? Number(currentAdminId) : null,
      actorEmail: req.user?.email || null,
      actorRole: req.user?.role || 'admin',
      action: 'CLUB_PROPOSAL_REJECT',
      resourceType: 'club',
      resourceId: clubId,
      details: {
        clubName: result.club?.club,
        rejectionReason: reason || 'Non précisé',
        rejectedBy: currentAdminId
      },
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    return sendSuccess(res, null, {
      message: 'Modifications refusées. Le président a été notifié par email.'
    });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors du rejet des modifications');
  }
};