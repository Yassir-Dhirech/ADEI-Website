const { Partner } = require('../models');
const { safeDeleteUpload } = require('../config/upload');
const { pickFields } = require('../utils/sanitize');

async function listPartners() {
  return Partner.findAll({
    where: { isActive: true },
    order: [['order_display', 'ASC'], ['name', 'ASC']]
  });
}

async function createPartner(body, file) {
  const data = pickFields(body, 'partners');
  if (file) data.logo = `/uploads/${file.filename}`;
  return Partner.create(data);
}

async function updatePartner(id, body, file) {
  const data = pickFields(body, 'partners');
  if (file) data.logo = `/uploads/${file.filename}`;
  const [updated] = await Partner.update(data, { where: { id } });
  return updated ? Partner.findByPk(id) : null;
}

async function deletePartner(id) {
  const partner = await Partner.findByPk(id);
  if (partner) safeDeleteUpload(partner.logo);
  return (await Partner.destroy({ where: { id } })) > 0;
}

async function reorderPartner(id, direction) {
  const partners = await listPartners();
  const idx = partners.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) return { notFound: true };

  const targetIdx = direction === 'up' && idx > 0
    ? idx - 1
    : (direction === 'down' && idx < partners.length - 1 ? idx + 1 : -1);
  if (targetIdx === -1) return { unchanged: true };

  for (let i = 0; i < partners.length; i++) {
    if (partners[i].order_display !== i) await partners[i].update({ order_display: i });
  }
  await partners[idx].update({ order_display: targetIdx });
  await partners[targetIdx].update({ order_display: idx });
  return { updated: true };
}

module.exports = { listPartners, createPartner, updatePartner, deletePartner, reorderPartner };