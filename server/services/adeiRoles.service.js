const { AdeiRole } = require('../models');

const listRoles = () => AdeiRole.findAll({ order: [['tier', 'ASC'], ['position', 'ASC']] });
const createRole = ({ name, tier, position }) => AdeiRole.create({ name, tier: tier ?? 3, position: position ?? 0 });
const updateRole = async (id, { name, tier, position }) => {
  const role = await AdeiRole.findByPk(id);
  if (!role) return null;
  await role.update({ ...(name !== undefined && { name }), ...(tier !== undefined && { tier }), ...(position !== undefined && { position }) });
  return role;
};
const deleteRole = async (id) => (await AdeiRole.destroy({ where: { id } })) > 0;

module.exports = { listRoles, createRole, updateRole, deleteRole };