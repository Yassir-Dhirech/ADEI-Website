import { ADEIMember, AdeiRole } from '../models';
import { safeDeleteUpload } from '../config/upload';
import { pickFields } from '../utils/sanitize';

async function attachRoleId(data: Record<string, unknown>): Promise<void> {
  if (typeof data.role === 'string' && !data.roleId) {
    const matched = await AdeiRole.findOne({ where: { name: data.role } });
    if (matched) data.roleId = matched.id;
  }
}

export async function listMembers(): Promise<ADEIMember[]> {
  return ADEIMember.findAll({
    include: [{ model: AdeiRole, as: 'roleInfo', attributes: ['id', 'name', 'tier', 'position'] }],
    order: [
      ['mandate', 'DESC'],
      [{ model: AdeiRole, as: 'roleInfo' }, 'tier', 'ASC'],
      [{ model: AdeiRole, as: 'roleInfo' }, 'position', 'ASC'],
      ['id', 'ASC']
    ]
  });
}

export async function createMember(body: Record<string, unknown>, file?: Express.Multer.File): Promise<ADEIMember> {
  const data = pickFields(body, 'adei-members');
  if (!data.mandate) data.mandate = '2025/2026';
  await attachRoleId(data);
  if (file) data.photo = `/uploads/${file.filename}`;
  return ADEIMember.create(data);
}

export async function updateMember(id: string | number, body: Record<string, unknown>, file?: Express.Multer.File): Promise<ADEIMember | null> {
  const data = pickFields(body, 'adei-members');
  await attachRoleId(data);
  if (file) data.photo = `/uploads/${file.filename}`;
  const [updated] = await ADEIMember.update(data, { where: { id } });
  return updated ? ADEIMember.findByPk(id) : null;
}

export async function deleteMember(id: string | number): Promise<boolean> {
  const member = await ADEIMember.findByPk(id);
  if (member) safeDeleteUpload(member.photo);
  return (await ADEIMember.destroy({ where: { id } })) > 0;
}
