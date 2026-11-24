import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { User } from '../models';
import { CreateUserInput, UpdateUserInput } from '../validators/schemas';

export async function getProfile(userId: number): Promise<User | null> {
  return User.findByPk(userId, { attributes: { exclude: ['password'] } });
}

export async function getPasswordSecurity(userId: number): Promise<User | null> {
  return User.findByPk(userId, { attributes: ['id', 'lastPasswordChange'] });
}

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<{ status: number; ok?: boolean; message?: string }> {
  const user = await User.findByPk(userId);
  if (!user) return { status: 404, message: 'Utilisateur non trouvé' };

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return { status: 400, message: 'Mot de passe actuel incorrect' };

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await user.update({ password: hashedPassword, lastPasswordChange: new Date() });
  return { status: 200, ok: true };
}

export async function listUsers(): Promise<User[]> {
  return User.findAll({ attributes: { exclude: ['password'] }, order: [['createdAt', 'DESC']] });
}

export async function createUser(body: CreateUserInput) {
  const {
    username,
    email,
    password,
    role,
    status,
    phone,
    filiere,
    classe,
    requested_role,
    is_president,
    is_representant,
    is_membre_adei,
    is_bureau_adei
  } = body;

  const existing = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
  if (existing) return { conflict: true as const };

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    role: role === 'admin' ? 'admin' : 'user',
    status: status || 'active',
    phone: phone || null,
    filiere: filiere || null,
    classe: classe || null,
    requested_role: requested_role || 'user',
    is_president: Boolean(is_president),
    is_representant: Boolean(is_representant),
    is_membre_adei: Boolean(is_membre_adei),
    is_bureau_adei: Boolean(is_bureau_adei)
  });

  const result = user.toJSON();
  const { password: _removed, ...safeUser } = result;
  return { conflict: false as const, user: safeUser };
}

export async function updateUser(id: string | number, body: UpdateUserInput): Promise<User | null> {
  const {
    username,
    email,
    password,
    role,
    status,
    phone,
    filiere,
    classe,
    requested_role,
    is_president,
    is_representant,
    is_membre_adei,
    is_bureau_adei
  } = body;
  const updateData: Record<string, unknown> = {};

  if (username !== undefined) updateData.username = username;
  if (email !== undefined) updateData.email = email;
  if (role === 'user' || role === 'admin') updateData.role = role;
  if (status && ['pending', 'active', 'rejected'].includes(status)) updateData.status = status;
  if (phone !== undefined) updateData.phone = phone;
  if (filiere !== undefined) updateData.filiere = filiere;
  if (classe !== undefined) updateData.classe = classe;
  if (requested_role !== undefined) updateData.requested_role = requested_role;
  if (typeof is_president === 'boolean') updateData.is_president = is_president;
  if (typeof is_representant === 'boolean') updateData.is_representant = is_representant;
  if (typeof is_membre_adei === 'boolean') updateData.is_membre_adei = is_membre_adei;
  if (typeof is_bureau_adei === 'boolean') updateData.is_bureau_adei = is_bureau_adei;

  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
    updateData.lastPasswordChange = new Date();
  }

  const [updated] = await User.update(updateData, { where: { id } });
  return updated ? User.findByPk(id, { attributes: { exclude: ['password'] } }) : null;
}

export async function deleteUser(id: string | number): Promise<{ lastAdmin?: boolean; deleted?: boolean }> {
  const user = await User.findByPk(id);
  if (user && user.role === 'admin') {
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount <= 1) return { lastAdmin: true };
  }
  const deleted = await User.destroy({ where: { id } });
  return { deleted: deleted > 0 };
}
