const service = require('../services/adeiRoles.service');

exports.getAll = async (req, res) => res.json({ success: true, data: await service.listRoles() });
exports.create = async (req, res) => res.status(201).json({ success: true, data: await service.createRole(req.body) });
exports.update = async (req, res) => {
  const role = await service.updateRole(req.params.id, req.body);
  if (!role) return res.status(404).json({ success: false, message: 'Rôle non trouvé' });
  res.json({ success: true, data: role });
};
exports.remove = async (req, res) => {
  const ok = await service.deleteRole(req.params.id);
  if (!ok) return res.status(404).json({ success: false, message: 'Rôle non trouvé' });
  res.json({ success: true, message: 'Rôle supprimé' });
};