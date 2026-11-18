const { Filiere } = require('../models');
const { pickFields } = require('../utils/sanitize');

async function listFilieres() {
  return Filiere.findAll({
    where: { isActive: true },
    order: [['order_display', 'ASC'], ['abbreviation', 'ASC']]
  });
}

async function createFiliere(body) {
  return Filiere.create(pickFields(body, 'filieres'));
}

async function updateFiliere(id, body) {
  const [updated] = await Filiere.update(pickFields(body, 'filieres'), { where: { id } });
  return updated ? Filiere.findByPk(id) : null;
}

async function deleteFiliere(id) {
  return (await Filiere.destroy({ where: { id } })) > 0;
}

module.exports = { listFilieres, createFiliere, updateFiliere, deleteFiliere };