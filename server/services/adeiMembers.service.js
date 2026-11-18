const { ADEIMember } = require('../models');
const { safeDeleteUpload } = require('../config/upload');
const { pickFields } = require('../utils/sanitize');

async function listMembers() {
  return ADEIMember.findAll({ order: [['createdAt', 'DESC']] });
}

async function createMember(body, file) {
  const data = pickFields(body, 'adei-members');
  if (file) data.photo = `/uploads/${file.filename}`;
  return ADEIMember.create(data);
}

async function updateMember(id, body, file) {
  const data = pickFields(body, 'adei-members');
  if (file) data.photo = `/uploads/${file.filename}`;
  const [updated] = await ADEIMember.update(data, { where: { id } });
  return updated ? ADEIMember.findByPk(id) : null;
}

async function deleteMember(id) {
  const member = await ADEIMember.findByPk(id);
  if (member) safeDeleteUpload(member.photo);
  return (await ADEIMember.destroy({ where: { id } })) > 0;
}

module.exports = { listMembers, createMember, updateMember, deleteMember };