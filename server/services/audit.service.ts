import { AuditLog, User } from '../models';

export interface LogActionParams {
  userId?: number | null;
  action: string;
  resourceType: string;
  resourceId?: string | number | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logAction(params: LogActionParams): Promise<AuditLog> {
  try {
    return await AuditLog.create({
      userId: params.userId || null,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId !== undefined && params.resourceId !== null ? String(params.resourceId) : null,
      details: params.details || null,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null
    });
  } catch (err) {
    console.error('[AuditLog Error]:', err);
    return null as unknown as AuditLog;
  }
}

export interface GetAuditLogsQuery {
  page?: number;
  limit?: number;
  action?: string;
  resourceType?: string;
  userId?: number;
}

export async function getAuditLogs(query: GetAuditLogsQuery = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
  const offset = (page - 1) * limit;

  const whereClause: Record<string, unknown> = {};
  if (query.action) whereClause.action = query.action;
  if (query.resourceType) whereClause.resourceType = query.resourceType;
  if (query.userId) whereClause.userId = query.userId;

  const { rows, count } = await AuditLog.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'role']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return {
    logs: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit)
  };
}
