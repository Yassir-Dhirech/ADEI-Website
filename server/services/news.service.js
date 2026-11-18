const { News, Club } = require('../models');
const { getCachedData, setCachedData, clearCache } = require('../utils/cache');
const { pickFields } = require('../utils/sanitize');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

function normalizeNewsInput(body, files) {
  const data = pickFields(body, 'news');

  if (data.clubId === 'adei' || data.clubId === 'ensa') {
    data.organizer = data.clubId === 'adei' ? 'ADEI' : 'Administration ENSA Fès';
    data.clubId = null;
  }
  if (data.clubId === '' || data.clubId === 'null' || data.clubId === 'undefined') {
    data.clubId = null;
  }
  if (data.clubId && !isNaN(data.clubId)) {
    data.clubId = parseInt(data.clubId, 10);
  }
  if (files?.image) data.image = `/uploads/${files.image[0].filename}`;
  if (files?.document) data.document = `/uploads/${files.document[0].filename}`;

  return data;
}

async function listNews(query = {}) {
  const { page, limit, offset } = parsePagination(query);
  const cacheKey = `news:p${page}:l${limit}`;
  const cached = getCachedData(cacheKey);
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

async function createNews(body, files) {
  const news = await News.create(normalizeNewsInput(body, files));
  clearCache('news');
  return news;
}

async function updateNews(id, body, files) {
  const [updated] = await News.update(normalizeNewsInput(body, files), { where: { id } });
  if (!updated) return null;
  clearCache('news');
  return News.findByPk(id);
}

async function deleteNews(id) {
  const deleted = await News.destroy({ where: { id } });
  if (!deleted) return false;
  clearCache('news');
  return true;
}

async function reorderNews(id, direction) {
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

module.exports = { listNews, createNews, updateNews, deleteNews, reorderNews };
