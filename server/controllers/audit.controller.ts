import { Request, Response } from 'express';
import * as auditService from '../services/audit.service';
import { sendSuccess, sendError } from '../utils/response';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 25;
    const action = req.query.action as string | undefined;
    const resourceType = req.query.resourceType as string | undefined;

    const result = await auditService.getAuditLogs({ page, limit, action, resourceType });
    return sendSuccess(res, result);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la récupération du journal d audit');
  }
};

export const logExport = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { eventId, eventTitle, count } = req.body;

    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    await auditService.logAction({
      userId: userId ? Number(userId) : null,
      action: 'ROSTER_EXPORT',
      resourceType: 'event_roster',
      resourceId: eventId,
      details: {
        eventTitle: eventTitle || `Événement #${eventId}`,
        exportedCount: count,
        note: 'Exportation CSV des données personnelles (Loi 09-08)'
      },
      ipAddress,
      userAgent
    });

    return sendSuccess(res, { logged: true });
  } catch (err) {
    console.error('Error logging export action:', err);
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de l enregistrement de l audit');
  }
};
