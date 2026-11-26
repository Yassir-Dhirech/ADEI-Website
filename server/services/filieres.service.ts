import { Filiere } from '../models';
import { pickFields } from '../utils/sanitize';

export async function listFilieres(): Promise<Filiere[]> {
  return Filiere.findAll({
    order: [['order_display', 'ASC'], ['abbreviation', 'ASC']]
  });
}

function parseDrives(value: unknown): Record<string, Array<{ label: string; url: string }>> {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, Array<{ label: string; url: string }>>;
  }
  try {
    const parsed = JSON.parse(String(value));
    return typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export async function createFiliere(body: Record<string, unknown>): Promise<Filiere> {
  const data = pickFields(body, 'filieres');
  if (data.drives !== undefined) {
    data.drives = parseDrives(data.drives);
  }
  return Filiere.create(data);
}

export async function updateFiliere(id: string | number, body: Record<string, unknown>): Promise<Filiere | null> {
  const data = pickFields(body, 'filieres');
  if (data.drives !== undefined) {
    data.drives = parseDrives(data.drives);
  }
  const [updated] = await Filiere.update(data, { where: { id } });
  return updated ? Filiere.findByPk(id) : null;
}

export async function deleteFiliere(id: string | number): Promise<boolean> {
  return (await Filiere.destroy({ where: { id } })) > 0;
}
