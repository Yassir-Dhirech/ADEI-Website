const newsService = require('../services/news.service');
const { sendSuccess, sendError } = require('../utils/response');

exports.getAll = async (req, res) => {
  const { data, meta } = await newsService.listNews(req.query);
  return sendSuccess(res, data, { meta });
};

exports.create = async (req, res) => {
  try {
    const news = await newsService.createNews(req.body, req.files);
    return sendSuccess(res, news, { status: 201, message: 'Actualité créée avec succès!' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', `Erreur lors de la création de l'actualité: ${error.message}`);
  }
};

exports.update = async (req, res) => {
  try {
    const news = await newsService.updateNews(req.params.id, req.body, req.files);
    if (!news) return sendError(res, 404, 'NOT_FOUND', 'Actualité non trouvée');
    return sendSuccess(res, news, { message: 'Actualité modifiée avec succès!' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la mise à jour de l'actualité");
  }
};

exports.remove = async (req, res) => {
  try {
    const ok = await newsService.deleteNews(req.params.id);
    if (!ok) return sendError(res, 404, 'NOT_FOUND', 'Actualité non trouvée');
    return sendSuccess(res, null, { message: 'Actualité supprimée' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la suppression de l'actualité");
  }
};

exports.reorder = async (req, res) => {
  try {
    const result = await newsService.reorderNews(req.params.id, req.body.direction);
    if (result.notFound) return sendError(res, 404, 'NOT_FOUND', 'Actualité non trouvée');
    const message = result.unchanged ? 'Aucun changement nécessaire' : 'Ordre modifié avec succès';
    return sendSuccess(res, null, { message });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la modification de l'ordre");
  }
};
