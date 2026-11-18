const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User } = require('../models');

async function getProfile(userId) {
  return User.findByPk(userId, { attributes: { exclude: ['password'] } });
}

async function getPasswordSecurity(userId) {
  return User.findByPk(userId, { attributes: ['id', 'lastPasswordChange'] });
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findByPk(userId);
  if (!user) return { status: 404, message: 'Utilisateur non trouvé' };

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return { status: 400, message: 'Mot de passe actuel incorrect' };

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await user.update({ password: hashedPassword, lastPasswordChange: new Date() });
  return { status: 200, ok: true };
}

async function listUsers() {
  return User.findAll({ attributes: { exclude: ['password'] }, order: [['createdAt', 'DESC']] });
}

async function createUser(body) {
  const { username, email, password, role, is_president, is_representant, is_membre_adei, is_bureau_adei } = body;

  const existing = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
  if (existing) return { conflict: true };

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    role: role === 'admin' ? 'admin' : 'user',
    is_president: Boolean(is_president),
    is_representant: Boolean(is_representant),
    is_membre_adei: Boolean(is_membre_adei),
    is_bureau_adei: Boolean(is_bureau_adei)
  });

  const result = user.toJSON();
  delete result.password;
  return { user: result };
}

async function updateUser(id, body) {
  const { username, email, password, role, is_president, is_representant, is_membre_adei, is_bureau_adei } = body;
  const updateData = {};

  if (username !== undefined) updateData.username = username;
  if (email !== undefined) updateData.email = email;
  if (role === 'user' || role === 'admin') updateData.role = role;
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

async function deleteUser(id) {
  const user = await User.findByPk(id);
  if (user && user.role === 'admin') {
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount <= 1) return { lastAdmin: true };
  }
  const deleted = await User.destroy({ where: { id } });
  return { deleted: deleted > 0 };
}

module.exports = { getProfile, getPasswordSecurity, changePassword, listUsers, createUser, updateUser, deleteUser };