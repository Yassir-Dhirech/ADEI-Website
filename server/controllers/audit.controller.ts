import { Request, Response } from 'express';
import * as auditService from '../services/audit.service';
import { sendSuccess, sendError } from '../utils/response';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 25;
    const action = req.query.action as string | undefined;
    const resourceType = req.query.resourceType as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await auditService.getAuditLogs({ page, limit, action, resourceType, search });

    // Auto-traçabilité : consigner l'acte de consultation du journal d'audit
    const currentAdminId = req.user?.id || req.user?.userId;
    await auditService.logAction({
      userId: currentAdminId ? Number(currentAdminId) : null,
      actorEmail: req.user?.email || null,
      actorRole: req.user?.role || 'admin',
      action: 'AUDIT_LOGS_VIEW',
      resourceType: 'audit_logs',
      details: { page, limit, filters: { action, resourceType, search } },
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    return sendSuccess(res, result);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la récupération du journal d audit');
  }
};
