const service = require('../services/academic.service');

exports.getTree = async (req, res) => res.json({ success: true, data: await service.getAcademicTree() });
exports.updateYear = async (req, res) => {
  const year = await service.updateYear(req.params.id, req.body);
  if (!year) return res.status(404).json({ success: false, message: 'Année non trouvée' });
  res.json({ success: true, data: year });
};
exports.updateSection = async (req, res) => {
  const sec = await service.updateSection(req.params.id, req.body);
  if (!sec) return res.status(404).json({ success: false, message: 'Section non trouvée' });
  res.json({ success: true, data: sec });
};