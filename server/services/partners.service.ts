import { Partner } from '../models';
import { safeDeleteUpload } from '../config/upload';
import { pickFields } from '../utils/sanitize';

export async function listPartners(): Promise<Partner[]> {
  return Partner.findAll({
    where: { isActive: true },
    order: [['order_display', 'ASC'], ['name', 'ASC']]
  });
}

export async function createPartner(body: Record<string, unknown>, file?: Express.Multer.File): Promise<Partner> {
  const data = pickFields(body, 'partners');
  if (file) data.logo = `/uploads/${file.filename}`;
  return Partner.create(data);
}

export async function updatePartner(id: string | number, body: Record<string, unknown>, file?: Express.Multer.File): Promise<Partner | null> {
  const data = pickFields(body, 'partners');
  if (file) data.logo = `/uploads/${file.filename}`;
  const [updated] = await Partner.update(data, { where: { id } });
  return updated ? Partner.findByPk(id) : null;
}

export async function deletePartner(id: string | number): Promise<boolean> {
  const partner = await Partner.findByPk(id);
  if (partner) safeDeleteUpload(partner.logo);
  return (await Partner.destroy({ where: { id } })) > 0;
}

export async function reorderPartner(id: string | number, direction: string): Promise<{ notFound?: boolean; unchanged?: boolean; updated?: boolean }> {
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
