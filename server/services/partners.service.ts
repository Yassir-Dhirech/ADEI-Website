import { Partner } from '../models';
import { pickFields } from '../utils/sanitize';
import { storageService } from './storage.service';

export async function listPartners(): Promise<Partner[]> {
  return Partner.findAll({
    where: { isActive: true },
    order: [['order_display', 'ASC'], ['name', 'ASC']]
  });
}

export async function createPartner(body: Record<string, unknown>, file?: Express.Multer.File): Promise<Partner> {
  const data = pickFields(body, 'partners');
  if (file) {
    const res = await storageService.saveFile(file, 'partners');
    data.logo = res.url;
  }
  return Partner.create(data);
}

export async function updatePartner(id: string | number, body: Record<string, unknown>, file?: Express.Multer.File): Promise<Partner | null> {
  const partner = await Partner.findByPk(id);
  if (!partner) return null;

  const data = pickFields(body, 'partners');
  if (file) {
    if (partner.logo) await storageService.deleteFile(partner.logo);
    const res = await storageService.saveFile(file, 'partners');
    data.logo = res.url;
  }
  await partner.update(data);
  return partner;
}

export async function deletePartner(id: string | number): Promise<boolean> {
  const partner = await Partner.findByPk(id);
  if (!partner) return false;
  if (partner.logo) await storageService.deleteFile(partner.logo);
  await partner.destroy();
  return true;
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