const service = require('../services/adeiRoles.service');
const { sendSuccess, sendError } = require('../utils/response');

exports.getAll = async (req, res) => {
  const data = await service.listRoles();
  return sendSuccess(res, data, { meta: { total: data.length } });
};

exports.create = async (req, res) => {
  const role = await service.createRole(req.body);
  return sendSuccess(res, role, { status: 201, message: 'Rôle créé avec succès!' });
};

exports.update = async (req, res) => {
  const role = await service.updateRole(req.params.id, req.body);
  if (!role) return sendError(res, 404, 'NOT_FOUND', 'Rôle non trouvé');
  return sendSuccess(res, role, { message: 'Rôle modifié avec succès!' });
};

exports.remove = async (req, res) => {
  const ok = await service.deleteRole(req.params.id);
  if (!ok) return sendError(res, 404, 'NOT_FOUND', 'Rôle non trouvé');
  return sendSuccess(res, null, { message: 'Rôle supprimé' });
};
