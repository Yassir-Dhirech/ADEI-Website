import { Filiere } from '../models';
import { pickFields } from '../utils/sanitize';

export async function listFilieres(): Promise<Filiere[]> {
  return Filiere.findAll({
    order: [['order_display', 'ASC'], ['abbreviation', 'ASC']]
  });
}

export async function createFiliere(body: Record<string, unknown>): Promise<Filiere> {
  return Filiere.create(pickFields(body, 'filieres'));
}

export async function updateFiliere(id: string | number, body: Record<string, unknown>): Promise<Filiere | null> {
  const [updated] = await Filiere.update(pickFields(body, 'filieres'), { where: { id } });
  return updated ? Filiere.findByPk(id) : null;
}

export async function deleteFiliere(id: string | number): Promise<boolean> {
  return (await Filiere.destroy({ where: { id } })) > 0;
}
