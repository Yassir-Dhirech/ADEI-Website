import { Op } from 'sequelize';
import { Event, Club, User, EventRegistration, EventOrganizer } from '../models';
import { getCachedData, setCachedData, clearCache } from '../utils/cache';
import { pickFields } from '../utils/sanitize';
import { parsePagination, buildPaginationMeta, PaginationMeta } from '../utils/pagination';
import { storageService } from './storage.service';
import { findClubForUser } from './clubs.service';

type UploadedFields = Record<string, Express.Multer.File[]> | Express.Multer.File[] | undefined;

function getFieldFile(files: UploadedFields, field: string): Express.Multer.File | undefined {
  if (!files || Array.isArray(files)) return undefined;
  return files[field]?.[0];
}

export function extractOrganizers(body: Record<string, unknown>): string[] {
  let list: string[] = [];
  if (Array.isArray(body.organizers)) {
    list = body.organizers.map((s) => String(s).trim()).filter(Boolean);
  } else if (typeof body.organizers === 'string' && body.organizers.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(body.organizers);
      if (Array.isArray(parsed)) {
        list = parsed.map((s) => String(s).trim()).filter(Boolean);
      }
    } catch {
      // fallback
    }
  }

  if (list.length === 0 && typeof body.organizer === 'string' && body.organizer.trim()) {
    list = body.organizer.split(/[•,]/).map((s) => s.trim()).filter(Boolean);
  }

  return Array.from(new Set(list));
}

async function syncEventOrganizers(eventId: number, orgList: string[]): Promise<void> {
  try {
    await EventOrganizer.destroy({ where: { eventId } });
    if (orgList.length === 0) return;

    const allClubs = await Club.findAll({ attributes: ['id', 'club'] });
    const clubMap = new Map<string, number>();
    for (const c of allClubs) {
      clubMap.set(c.club.toLowerCase().trim(), c.id);
    }

    for (const orgName of orgList) {
      const matchedClubId = clubMap.get(orgName.toLowerCase().trim()) || null;
      await EventOrganizer.create({
        eventId,
        clubId: matchedClubId,
        organizerName: orgName
      });
    }
  } catch (err) {
    console.warn('[syncEventOrganizers error]:', err instanceof Error ? err.message : err);
  }
}

async function normalizeEventInput(
  body: Record<string, unknown>,
  files: UploadedFields,
  existing?: Event | null
): Promise<Record<string, unknown>> {
  const data = pickFields(body, 'events');

  const orgList = extractOrganizers(body);
  if (orgList.length > 0) {
    data.organizer = orgList.join(' • ');
  }

  if (data.clubId === 'adei' || data.clubId === 'ensa') {
    data.organizer = data.clubId === 'adei' ? 'ADEI' : 'Administration ENSA Fès';
    data.clubId = null;
  }
  if (data.clubId === '' || data.clubId === 'null' || data.clubId === 'undefined') {
    data.clubId = null;
  }
  if (data.clubId && !isNaN(Number(data.clubId))) {
    data.clubId = parseInt(String(data.clubId), 10);
  }

  const img = getFieldFile(files, 'image');
  const doc = getFieldFile(files, 'document');

  if (img) {
    if (existing?.image) await storageService.deleteFile(existing.image);
    const res = await storageService.saveFile(img, 'events');
    data.image = res.url;
  }
  if (doc) {
    if (existing?.document) await storageService.deleteFile(existing.document);
    const res = await storageService.saveFile(doc, 'documents');
    data.document = res.url;
  }

  return data;
}

export async function listEvents(
  query: Record<string, unknown> = {},
  currentUserId?: number
): Promise<{ data: Array<Record<string, unknown>>; meta: PaginationMeta; cached: boolean }> {
  const { page, limit, offset } = parsePagination(query);
  const cacheKey = `events:p${page}:l${limit}:u${currentUserId || 'anon'}`;
  const cached = getCachedData<{ data: Array<Record<string, unknown>>; meta: PaginationMeta }>(cacheKey);
  if (cached) return { ...cached, cached: true };

  try {
    const { rows, count } = await Event.findAndCountAll({
      where: { status: 'approved' },
      order: [['order_display', 'ASC'], ['createdAt', 'DESC']],
      include: [
        { model: Club, as: 'club', attributes: ['id', 'club', 'president'], required: false },
        { model: EventRegistration, as: 'registrations', attributes: ['id', 'userId'], required: false }
      ],
      limit,
      offset
    });

    const formatted = rows.map((ev) => {
      const json = ev.toJSON() as Record<string, unknown>;
      const regs = (json.registrations || []) as Array<{ id: number; userId: number }>;
      return {
        ...json,
        registrationsCount: regs.length,
        isRegistered: currentUserId ? regs.some((r) => r.userId === currentUserId) : false
      };
    });

    const result = { data: formatted, meta: buildPaginationMeta(count, page, limit) };
    setCachedData(cacheKey, result);
    return { ...result, cached: false };
  } catch (err) {
    console.warn('[listEvents] Status fallback:', err instanceof Error ? err.message : err);
    const { rows, count } = await Event.findAndCountAll({
      order: [['order_display', 'ASC'], ['createdAt', 'DESC']],
      include: [{ model: Club, as: 'club', attributes: ['id', 'club', 'president'], required: false }],
      limit,
      offset
    });
    const result = {
      data: rows.map((r) => r.toJSON() as Record<string, unknown>),
      meta: buildPaginationMeta(count, page, limit)
    };
    return { ...result, cached: false };
  }
}

export async function createEvent(body: Record<string, unknown>, files: UploadedFields): Promise<Event> {
  const input = await normalizeEventInput(body, files);
  const event = await Event.create(input);
  const orgList = extractOrganizers(body);
  if (orgList.length > 0) {
    await syncEventOrganizers(event.id, orgList);
  }
  clearCache('events');
  return event;
}

export async function updateEvent(id: string | number, body: Record<string, unknown>, files: UploadedFields): Promise<Event | null> {
  const existing = await Event.findByPk(id);
  if (!existing) return null;

  const input = await normalizeEventInput(body, files, existing);
  await existing.update(input);
  const orgList = extractOrganizers(body);
  if (orgList.length > 0 || body.organizers !== undefined || body.organizer !== undefined) {
    await syncEventOrganizers(existing.id, orgList);
  }
  clearCache('events');
  return existing;
}

export async function deleteEvent(id: string | number): Promise<boolean> {
  const event = await Event.findByPk(id);
  if (!event) return false;

  if (event.image) await storageService.deleteFile(event.image);
  if (event.document) await storageService.deleteFile(event.document);

  await event.destroy();
  clearCache('events');
  return true;
}

export async function reorderEvent(id: string | number, direction: string): Promise<{ notFound?: boolean; unchanged?: boolean; updated?: boolean }> {
  const all = await Event.findAll({ order: [['order_display', 'ASC'], ['createdAt', 'DESC']] });
  const idx = all.findIndex((item) => String(item.id) === String(id));
  if (idx === -1) return { notFound: true };

  const targetIdx = direction === 'up' && idx > 0
    ? idx - 1
    : (direction === 'down' && idx < all.length - 1 ? idx + 1 : -1);

  if (targetIdx === -1) return { unchanged: true };

  for (let i = 0; i < all.length; i++) {
    if (all[i].order_display !== i) await all[i].update({ order_display: i });
  }
  await all[idx].update({ order_display: targetIdx });
  await all[targetIdx].update({ order_display: idx });
  clearCache('events');
  return { updated: true };
}
export async function getEventById(id: string | number): Promise<Event | null> {
  return Event.findByPk(id, {
    include: [
      { model: Club, as: 'club', attributes: ['id', 'club', 'president'], required: false },
      { model: User, as: 'submitter', attributes: ['id', 'username', 'email'], required: false }
    ]
  });
}

export async function listEventsForUser(userId: number): Promise<Event[]> {
  const userClub = await findClubForUser(userId);
  let whereClause: Record<string, unknown> = { submittedBy: userId };

  if (userClub) {
    const coOrgEvents = await EventOrganizer.findAll({
      where: { clubId: userClub.id },
      attributes: ['eventId']
    });
    const coOrgEventIds = coOrgEvents.map((o) => o.eventId);

    const orConditions: Array<Record<string, unknown>> = [
      { submittedBy: userId },
      { clubId: userClub.id }
    ];

    if (coOrgEventIds.length > 0) {
      orConditions.push({ id: { [Op.in]: coOrgEventIds } });
    }

    whereClause = {
      [Op.or]: orConditions
    };
  }

  return Event.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    include: [
      { model: Club, as: 'club', attributes: ['id', 'club', 'president'], required: false },
      {
        model: EventRegistration,
        as: 'registrations',
        attributes: ['id', 'userId', 'guestName', 'guestEmail', 'guestPhone', 'guestFiliere', 'createdAt'],
        required: false,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'phone', 'filiere', 'classe']
          }
        ]
      }
    ]
  });
}

export async function listModerationEvents(): Promise<Event[]> {
  return Event.findAll({
    order: [['createdAt', 'DESC']],
    include: [
      { model: Club, as: 'club', attributes: ['id', 'club', 'president'], required: false },
      { model: User, as: 'submitter', attributes: ['id', 'username', 'email'], required: false },
      {
        model: EventRegistration,
        as: 'registrations',
        attributes: ['id', 'userId', 'guestName', 'guestEmail', 'guestPhone', 'guestFiliere', 'createdAt'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'phone', 'filiere', 'classe']
          }
        ]
      }
    ]
  });
}

export async function toggleEventRegistration(
  eventId: string | number,
  userId: number
): Promise<{ ok: boolean; status?: number; message?: string; registered: boolean; count: number }> {
  const event = await Event.findByPk(eventId);
  if (!event) {
    return { ok: false, status: 404, message: 'Événement non trouvé', registered: false, count: 0 };
  }

  const existing = await EventRegistration.findOne({
    where: { eventId: Number(eventId), userId }
  });

  let registered = false;
  if (existing) {
    await existing.destroy();
    registered = false;
  } else {
    await EventRegistration.create({
      eventId: Number(eventId),
      userId
    });
    registered = true;
  }

  const count = await EventRegistration.count({
    where: { eventId: Number(eventId) }
  });

  clearCache('events');
  return { ok: true, registered, count };
}

export async function registerGuestForEvent(
  eventId: string | number,
  guestData: {
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    guestFiliere?: string;
  }
): Promise<{ ok: boolean; status?: number; message?: string; count: number }> {
  const event = await Event.findByPk(eventId);
  if (!event) {
    return { ok: false, status: 404, message: 'Événement non trouvé', count: 0 };
  }

  const email = guestData.guestEmail.trim().toLowerCase();

  const existingGuest = await EventRegistration.findOne({
    where: {
      eventId: Number(eventId),
      guestEmail: email
    }
  });

  if (existingGuest) {
    const totalCount = await EventRegistration.count({ where: { eventId: Number(eventId) } });
    return {
      ok: false,
      status: 400,
      message: 'Une inscription existe déjà avec cette adresse email pour cet événement.',
      count: totalCount
    };
  }

  const userWithEmail = await User.findOne({ where: { email } });
  if (userWithEmail) {
    const userReg = await EventRegistration.findOne({
      where: {
        eventId: Number(eventId),
        userId: userWithEmail.id
      }
    });
    if (userReg) {
      const totalCount = await EventRegistration.count({ where: { eventId: Number(eventId) } });
      return {
        ok: false,
        status: 400,
        message: 'Vous êtes déjà inscrit(e) à cet événement avec votre compte étudiant.',
        count: totalCount
      };
    }
  }

  try {
    await EventRegistration.create({
      eventId: Number(eventId),
      userId: userWithEmail ? userWithEmail.id : null,
      guestName: guestData.guestName.trim(),
      guestEmail: email,
      guestPhone: guestData.guestPhone ? guestData.guestPhone.trim() : null,
      guestFiliere: guestData.guestFiliere ? guestData.guestFiliere.trim() : null
    });
  } catch (err: unknown) {
    const totalCount = await EventRegistration.count({ where: { eventId: Number(eventId) } });
    if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'SequelizeUniqueConstraintError') {
      return {
        ok: false,
        status: 400,
        message: 'Une inscription existe déjà avec cette adresse email pour cet événement.',
        count: totalCount
      };
    }
    throw err;
  }

  const count = await EventRegistration.count({
    where: { eventId: Number(eventId) }
  });

  clearCache('events');
  return { ok: true, count };
}

export async function getEventRegistrations(eventId: string | number) {
  return EventRegistration.findAll({
    where: { eventId: Number(eventId) },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'phone', 'filiere', 'classe']
      }
    ],
    order: [['createdAt', 'DESC']]
  });
}

export async function updateEventStatus(
  eventId: string | number,
  status: 'approved' | 'rejected' | 'pending',
  adminId: number,
  rejectionReason?: string
): Promise<{ ok: boolean; status?: number; message?: string; event?: Event; submitterUser?: User | null }> {
  const event = await Event.findByPk(eventId);
  if (!event) return { ok: false, status: 404, message: 'Événement non trouvé' };

  await event.update({
    status,
    reviewedBy: adminId,
    reviewedAt: new Date(),
    rejectionReason: status === 'rejected' ? (rejectionReason || null) : null
  });

  clearCache('events');

  const submitterUser = event.submittedBy ? await User.findByPk(event.submittedBy) : null;
  return { ok: true, event, submitterUser };
}