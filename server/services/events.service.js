const { Event, Club } = require('../models');
const { getCachedData, setCachedData, clearCache } = require('../utils/cache');
const { pickFields } = require('../utils/sanitize');

function normalizeEventInput(body, files) {
  const data = pickFields(body, 'events');

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

async function listEvents() {
  const cached = getCachedData('events');
  if (cached) return { data: cached, cached: true };

  const events = await Event.findAll({
    order: [['order_display', 'ASC'], ['createdAt', 'DESC']],
    include: [{ model: Club, as: 'club', attributes: ['id', 'club', 'president'], required: false }]
  });

  setCachedData('events', events);
  return { data: events, cached: false };
}

async function createEvent(body, files) {
  const event = await Event.create(normalizeEventInput(body, files));
  clearCache('events');
  return event;
}

async function updateEvent(id, body, files) {
  const [updated] = await Event.update(normalizeEventInput(body, files), { where: { id } });
  if (!updated) return null;
  clearCache('events');
  return Event.findByPk(id);
}

async function deleteEvent(id) {
  const deleted = await Event.destroy({ where: { id } });
  if (!deleted) return false;
  clearCache('events');
  return true;
}

async function reorderEvent(id, direction) {
  const current = await Event.findByPk(id);
  if (!current) return { notFound: true };

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
clearCache('events'); 
return { updated: true };
}

module.exports = { listEvents, createEvent, updateEvent, deleteEvent, reorderEvent };