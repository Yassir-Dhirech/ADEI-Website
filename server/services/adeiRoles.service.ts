import { AdeiRole } from '../models';
import { AdeiRoleCreateInput, AdeiRoleUpdateInput } from '../validators/schemas';

export const listRoles = (): Promise<AdeiRole[]> =>
  AdeiRole.findAll({ order: [['tier', 'ASC'], ['position', 'ASC']] });

export const createRole = ({ name, tier, position }: AdeiRoleCreateInput): Promise<AdeiRole> =>
  AdeiRole.create({ name, tier: tier ?? 3, position: position ?? 0 });

export const updateRole = async (id: string | number, { name, tier, position }: AdeiRoleUpdateInput): Promise<AdeiRole | null> => {
  const role = await AdeiRole.findByPk(id);
  if (!role) return null;
  await role.update({
    ...(name !== undefined && { name }),
    ...(tier !== undefined && { tier }),
    ...(position !== undefined && { position })
  });
  return role;
};

export const deleteRole = async (id: string | number): Promise<boolean> =>
  (await AdeiRole.destroy({ where: { id } })) > 0;
