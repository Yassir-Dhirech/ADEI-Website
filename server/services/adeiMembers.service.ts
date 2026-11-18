import { ADEIMember } from '../models';
import { safeDeleteUpload } from '../config/upload';
import { pickFields } from '../utils/sanitize';

export async function listMembers(): Promise<ADEIMember[]> {
  return ADEIMember.findAll({ order: [['createdAt', 'DESC']] });
}

export async function createMember(body: Record<string, unknown>, file?: Express.Multer.File): Promise<ADEIMember> {
  const data = pickFields(body, 'adei-members');
  if (file) data.photo = `/uploads/${file.filename}`;
  return ADEIMember.create(data);
}

export async function updateMember(id: string | number, body: Record<string, unknown>, file?: Express.Multer.File): Promise<ADEIMember | null> {
  const data = pickFields(body, 'adei-members');
  if (file) data.photo = `/uploads/${file.filename}`;
  const [updated] = await ADEIMember.update(data, { where: { id } });
  return updated ? ADEIMember.findByPk(id) : null;
}

export async function deleteMember(id: string | number): Promise<boolean> {
  const member = await ADEIMember.findByPk(id);
  if (member) safeDeleteUpload(member.photo);
  return (await ADEIMember.destroy({ where: { id } })) > 0;
}
