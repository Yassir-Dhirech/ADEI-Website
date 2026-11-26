import { Op } from 'sequelize';
import { AuditLog, User } from '../models';

export interface LogActionParams {
  userId?: number | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | number | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  strict?: boolean;
}

/**
 * Filtre récursif défensif pour empêcher toute fuite de secret (mots de passe, tokens, OTPs)
 * dans le journal d'audit.
 */
function sanitizeDetails(data: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;

  const forbiddenKeys = [
    'password',
    'newpassword',
    'currentpassword',
    'token',
    'jwt',
    'secret',
    'otp',
    'authorization',
    'cookie'
  ];

  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (forbiddenKeys.some((f) => lowerKey.includes(f))) {
      cleaned[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      cleaned[key] = sanitizeDetails(value as Record<string, unknown>);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

export async function logAction(params: LogActionParams): Promise<AuditLog | null> {
  let actorEmail = params.actorEmail || null;
  let actorRole = params.actorRole || null;

  // Si l'acteur n'a pas transmis son email/rôle explicitement mais qu'un userId est fourni
  if (params.userId && (!actorEmail || !actorRole)) {
    try {
      const actor = await User.findByPk(params.userId, { attributes: ['email', 'role'] });
      if (actor) {
        actorEmail = actorEmail || actor.email;
        actorRole = actorRole || actor.role;
      }
    } catch (_) {
      // Ignorer pour ne pas bloquer l'écriture
    }
  }

  const safeDetails = sanitizeDetails(params.details);

  try {
    return await AuditLog.create({
      userId: params.userId || null,
      actorEmail,
      actorRole,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId !== undefined && params.resourceId !== null ? String(params.resourceId) : null,
      details: safeDetails,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null
    });
  } catch (err) {
    console.error('[AuditLog Error]:', err);
    if (params.strict) {
      throw err; // Propage l'erreur pour faire échouer les opérations critiques (ROSTER_EXPORT, rôle, etc.)
    }
    return null;
  }
}

export interface GetAuditLogsQuery {
  page?: number;
  limit?: number;
  action?: string;
  resourceType?: string;
  userId?: number;
  search?: string;
}

export async function getAuditLogs(query: GetAuditLogsQuery = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  // Plafond strict à 100 entrées par page pour prévenir les attaques DoS par mémoire
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
  const offset = (page - 1) * limit;

  const whereClause: Record<string, unknown> = {};
  if (query.action) whereClause.action = query.action;
  if (query.resourceType) whereClause.resourceType = query.resourceType;
  if (query.userId) whereClause.userId = query.userId;

  if (query.search && query.search.trim()) {
    // Échappement des caractères joker SQL % et _
    const escapedSearch = query.search.trim().replace(/[%_]/g, '\\$&');
    whereClause[Op.or as unknown as string] = [
      { action: { [Op.iLike]: `%${escapedSearch}%` } },
      { resourceType: { [Op.iLike]: `%${escapedSearch}%` } },
      { actorEmail: { [Op.iLike]: `%${escapedSearch}%` } }
    ];
  }

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
