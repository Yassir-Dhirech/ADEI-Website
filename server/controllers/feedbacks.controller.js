const feedbacksService = require('../services/feedbacks.service');
const { sendSuccess, sendError } = require('../utils/response');

exports.getPublic = async (req, res) => {
  const { data, meta } = await feedbacksService.listPublicFeedbacks(req.query);
  return sendSuccess(res, data, { meta });
};

exports.getAll = async (req, res) => {
  try {
    const { data, meta } = await feedbacksService.listAllFeedbacks(req.query);
    return sendSuccess(res, data, { meta });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la récupération des feedbacks');
  }
};

exports.create = async (req, res) => {
  try {
    const cookieToken = req.cookies?.adei_token;
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const feedback = await feedbacksService.createFeedback(req.body, cookieToken || headerToken);
    return sendSuccess(res, feedback, { status: 201, message: 'Votre feedback a été envoyé avec succès!' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de l'envoi du feedback");
  }
};

exports.markRead = async (req, res) => {
  try {
    const feedback = await feedbacksService.markAsRead(req.params.id);
    if (!feedback) return sendError(res, 404, 'NOT_FOUND', 'Feedback non trouvé');
    return sendSuccess(res, feedback);
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la mise à jour du feedback');
  }
};

exports.publish = async (req, res) => {
  try {
    const feedback = await feedbacksService.setPublished(req.params.id, req.body?.isPublished);
    if (!feedback) return sendError(res, 404, 'NOT_FOUND', 'Feedback non trouvé');
    return sendSuccess(res, feedback);
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la modération du feedback');
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const result = await feedbacksService.toggleLike(req.params.id, userId);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors du like');
  }
};

exports.remove = async (req, res) => {
  try {
    const ok = await feedbacksService.deleteFeedback(req.params.id);
    if (!ok) return sendError(res, 404, 'NOT_FOUND', 'Feedback non trouvé');
    return sendSuccess(res, null, { message: 'Feedback supprimé' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la suppression du feedback');
  }
};
