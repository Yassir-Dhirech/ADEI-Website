import { Request, Response } from 'express';
import * as eventsService from '../services/events.service';
import { findClubForUser } from '../services/clubs.service';
import { User } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import {
  notifyAdminNewEventSubmission,
  notifyPresidentEventDecision
} from '../services/notification.service';

export const getAll = async (req: Request, res: Response) => {
  const userId = req.user?.id || req.user?.userId;
  const { data, meta } = await eventsService.listEvents(req.query as Record<string, unknown>, userId);
  return sendSuccess(res, data, { meta: { ...meta } });
};

export const getMyEvents = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id || req.user!.userId!;
    const events = await eventsService.listEventsForUser(userId);
    return sendSuccess(res, events);
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la récupération de vos événements');
  }
};

export const getModerationEvents = async (_req: Request, res: Response) => {
  try {
    const events = await eventsService.listModerationEvents();
    return sendSuccess(res, events);
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la récupération des événements à modérer');
  }
};

export const toggleRegistration = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id || req.user!.userId!;
    const eventId = String(req.params.id);
    const result = await eventsService.toggleEventRegistration(eventId, userId);
    if (!result.ok) {
      return sendError(res, result.status || 400, 'BAD_REQUEST', result.message || "Erreur lors de l'inscription");
    }
    return sendSuccess(res, { registered: result.registered, count: result.count }, {
      message: result.registered
        ? 'Votre inscription a bien été confirmée !'
        : 'Votre désinscription a bien été prise en compte.'
    });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de l'enregistrement de l'inscription");
  }
};

export const getRegistrations = async (req: Request, res: Response) => {
  try {
    const eventId = String(req.params.id);
    const attendees = await eventsService.getEventRegistrations(eventId);
    return sendSuccess(res, attendees);
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la récupération des inscrits");
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id || req.user!.userId!;
    const isAdmin = req.user!.role === 'admin';
    const body = { ...req.body };

    let userClub = null;

    if (!isAdmin) {
      const user = await User.findByPk(userId);
      userClub = await findClubForUser(userId);

      const isPresident = user?.is_president || user?.requested_role === 'president' || userClub !== null;
      if (!isPresident) {
        return sendError(res, 403, 'FORBIDDEN', 'Seuls les présidents de club ou les administrateurs peuvent proposer des événements');
      }

      // Règle d'or : statut forcé à pending pour validation ADEI
      body.status = 'pending';
      body.submittedBy = userId;
      if (userClub) {
        body.clubId = userClub.id;
        if (!body.organizer) body.organizer = userClub.club;
      }
    } else {
      if (!body.status) body.status = 'approved';
    }

    const event = await eventsService.createEvent(body, req.files);

    if (!isAdmin && event) {
      const clubTitle = userClub?.club || event.organizer || 'Club Étudiant';
      void notifyAdminNewEventSubmission({
        eventTitle: event.title,
        eventDate: event.date,
        clubName: clubTitle,
        presidentName: req.user!.username || 'Président de Club',
        presidentEmail: req.user!.email || ''
      });
    }

    return sendSuccess(res, event, {
      status: 201,
      message: isAdmin
        ? 'Événement créé et publié avec succès !'
        : "Événement soumis avec succès. Il a été transmis au bureau de l'ADEI pour validation."
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return sendError(res, 500, 'SERVER_ERROR', `Erreur lors de la création de l'événement: ${msg}`);
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id || req.user!.userId!;
    const isAdmin = req.user!.role === 'admin';
    const eventId = String(req.params.id);
    const body = { ...req.body };

    const existing = await eventsService.getEventById(eventId);
    if (!existing) return sendError(res, 404, 'NOT_FOUND', 'Événement non trouvé');

    if (!isAdmin) {
      if (existing.submittedBy !== userId) {
        return sendError(res, 403, 'FORBIDDEN', "Vous n'avez pas l'autorisation de modifier cet événement");
      }
      // Règle de gouvernance : toute modification repasse en pending pour ré-approbation ADEI
      body.status = 'pending';
    }

    const event = await eventsService.updateEvent(eventId, body, req.files);
    if (!event) return sendError(res, 404, 'NOT_FOUND', 'Événement non trouvé');

    if (!isAdmin) {
      void notifyAdminNewEventSubmission({
        eventTitle: event.title,
        eventDate: event.date,
        clubName: event.organizer || 'Club',
        presidentName: req.user!.username || 'Président',
        presidentEmail: req.user!.email || ''
      });
    }

    return sendSuccess(res, event, {
      message: isAdmin
        ? 'Événement modifié avec succès'
        : "Modifications enregistrées. L'événement est en attente de re-validation par l'ADEI."
    });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la mise à jour de l'événement");
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const eventId = String(req.params.id);
    const { status, rejectionReason } = req.body;
    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return sendError(res, 400, 'BAD_REQUEST', 'Statut invalide (approved, rejected ou pending)');
    }

    const adminId = req.user!.id || req.user!.userId!;
    const result = await eventsService.updateEventStatus(eventId, status, adminId, rejectionReason);
    if (!result.ok) {
      return sendError(res, result.status || 400, 'BAD_REQUEST', result.message || 'Erreur');
    }

    if (result.submitterUser && result.event && (status === 'approved' || status === 'rejected')) {
      void notifyPresidentEventDecision({
        presidentEmail: result.submitterUser.email,
        presidentName: result.submitterUser.username,
        eventTitle: result.event.title,
        decision: status,
        rejectionReason
      });
    }

    return sendSuccess(res, result.event, {
      message: status === 'approved'
        ? 'Événement approuvé et publié en ligne avec succès !'
        : 'Événement refusé. Le président a été notifié par email.'
    });
  } catch {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la mise à jour du statut de l'événement");
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