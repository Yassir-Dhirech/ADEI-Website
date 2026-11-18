import { News, Club } from '../models';
import { getCachedData, setCachedData, clearCache } from '../utils/cache';
import { pickFields } from '../utils/sanitize';
import { parsePagination, buildPaginationMeta, PaginationMeta } from '../utils/pagination';

type UploadedFields = Record<string, Express.Multer.File[]> | Express.Multer.File[] | undefined;

function getFieldFile(files: UploadedFields, field: string): Express.Multer.File | undefined {
  if (!files || Array.isArray(files)) return undefined;
  return files[field]?.[0];
}

function normalizeNewsInput(body: Record<string, unknown>, files: UploadedFields): Record<string, unknown> {
  const data = pickFields(body, 'news');

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

export async function listNews(query: Record<string, unknown> = {}): Promise<{ data: News[]; meta: PaginationMeta; cached: boolean }> {
  const { page, limit, offset } = parsePagination(query);
  const cacheKey = `news:p${page}:l${limit}`;
  const cached = getCachedData<{ data: News[]; meta: PaginationMeta }>(cacheKey);
  if (cached) return { ...cached, cached: true };

  const { rows, count } = await News.findAndCountAll({
    order: [['order_display', 'ASC'], ['createdAt', 'DESC']],
    include: [{ model: Club, as: 'club', attributes: ['id', 'club', 'president'], required: false }],
    limit,
    offset
  });

  const result = { data: rows, meta: buildPaginationMeta(count, page, limit) };
  setCachedData(cacheKey, result);
  return { ...result, cached: false };
}

export async function createNews(body: Record<string, unknown>, files: UploadedFields): Promise<News> {
  const news = await News.create(normalizeNewsInput(body, files));
  clearCache('news');
  return news;
}

export async function updateNews(id: string | number, body: Record<string, unknown>, files: UploadedFields): Promise<News | null> {
  const [updated] = await News.update(normalizeNewsInput(body, files), { where: { id } });
  if (!updated) return null;
  clearCache('news');
  return News.findByPk(id);
}

export async function deleteNews(id: string | number): Promise<boolean> {
  const deleted = await News.destroy({ where: { id } });
  if (!deleted) return false;
  clearCache('news');
  return true;
}

export async function reorderNews(id: string | number, direction: string): Promise<{ notFound?: boolean; unchanged?: boolean; updated?: boolean }> {
  const all = await News.findAll({ order: [['order_display', 'ASC'], ['createdAt', 'DESC']] });
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
  clearCache('news');
  return { updated: true };
}
