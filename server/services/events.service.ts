import { Event, Club } from '../models';
import { getCachedData, setCachedData, clearCache } from '../utils/cache';
import { pickFields } from '../utils/sanitize';
import { parsePagination, buildPaginationMeta, PaginationMeta } from '../utils/pagination';

type UploadedFields = Record<string, Express.Multer.File[]> | Express.Multer.File[] | undefined;

function getFieldFile(files: UploadedFields, field: string): Express.Multer.File | undefined {
  if (!files || Array.isArray(files)) return undefined;
  return files[field]?.[0];
}

function normalizeEventInput(body: Record<string, unknown>, files: UploadedFields): Record<string, unknown> {
  const data = pickFields(body, 'events');

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
  if (img) data.image = `/uploads/${img.filename}`;
  if (doc) data.document = `/uploads/${doc.filename}`;

  return data;
}

export async function listEvents(query: Record<string, unknown> = {}): Promise<{ data: Event[]; meta: PaginationMeta; cached: boolean }> {
  const { page, limit, offset } = parsePagination(query);
  const cacheKey = `events:p${page}:l${limit}`;
  const cached = getCachedData<{ data: Event[]; meta: PaginationMeta }>(cacheKey);
  if (cached) return { ...cached, cached: true };

  const { rows, count } = await Event.findAndCountAll({
    order: [['order_display', 'ASC'], ['createdAt', 'DESC']],
    include: [{ model: Club, as: 'club', attributes: ['id', 'club', 'president'], required: false }],
    limit,
    offset
  });

  const result = { data: rows, meta: buildPaginationMeta(count, page, limit) };
  setCachedData(cacheKey, result);
  return { ...result, cached: false };
}

export async function createEvent(body: Record<string, unknown>, files: UploadedFields): Promise<Event> {
  const event = await Event.create(normalizeEventInput(body, files));
  clearCache('events');
  return event;
}

export async function updateEvent(id: string | number, body: Record<string, unknown>, files: UploadedFields): Promise<Event | null> {
  const [updated] = await Event.update(normalizeEventInput(body, files), { where: { id } });
  if (!updated) return null;
  clearCache('events');
  return Event.findByPk(id);
}

export async function deleteEvent(id: string | number): Promise<boolean> {
  const deleted = await Event.destroy({ where: { id } });
  if (!deleted) return false;
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
