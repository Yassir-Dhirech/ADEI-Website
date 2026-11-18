const eventsService = require('../services/events.service');
const { sendSuccess, sendError } = require('../utils/response');

exports.getAll = async (req, res) => {
  const { data, meta } = await eventsService.listEvents(req.query);
  return sendSuccess(res, data, { meta });
};

exports.create = async (req, res) => {
  try {
    const event = await eventsService.createEvent(req.body, req.files);
    return sendSuccess(res, event, { status: 201, message: 'Événement créé avec succès!' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', `Erreur lors de la création de l'événement: ${error.message}`);
  }
};

exports.update = async (req, res) => {
  try {
    const event = await eventsService.updateEvent(req.params.id, req.body, req.files);
    if (!event) return sendError(res, 404, 'NOT_FOUND', 'Événement non trouvé');
    return sendSuccess(res, event, { message: 'Événement modifié avec succès!' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la mise à jour de l'événement");
  }
};

exports.remove = async (req, res) => {
  try {
    const ok = await eventsService.deleteEvent(req.params.id);
    if (!ok) return sendError(res, 404, 'NOT_FOUND', 'Événement non trouvé');
    return sendSuccess(res, null, { message: 'Événement supprimé' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la suppression de l'événement");
  }
};

exports.reorder = async (req, res) => {
  try {
    const result = await eventsService.reorderEvent(req.params.id, req.body.direction);
    if (result.notFound) return sendError(res, 404, 'NOT_FOUND', 'Événement non trouvé');
    const message = result.unchanged ? 'Aucun changement nécessaire' : 'Ordre modifié avec succès';
    return sendSuccess(res, null, { message });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la modification de l'ordre");
  }
};
