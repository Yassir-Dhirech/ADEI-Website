const service = require('../services/academic.service');
const { sendSuccess, sendError } = require('../utils/response');

exports.getTree = async (req, res) => {
  const data = await service.getAcademicTree();
  return sendSuccess(res, data);
};

exports.updateYear = async (req, res) => {
  const year = await service.updateYear(req.params.id, req.body);
  if (!year) return sendError(res, 404, 'NOT_FOUND', 'Année non trouvée');
  return sendSuccess(res, year, { message: 'Année mise à jour' });
};

exports.updateSection = async (req, res) => {
  const sec = await service.updateSection(req.params.id, req.body);
  if (!sec) return sendError(res, 404, 'NOT_FOUND', 'Section non trouvée');
  return sendSuccess(res, sec, { message: 'Section mise à jour' });
};
