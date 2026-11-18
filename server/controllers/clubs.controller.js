const clubsService = require('../services/clubs.service');
const { sendSuccess, sendError } = require('../utils/response');

exports.getAll = async (req, res) => {
  const data = await clubsService.listClubs();
  return sendSuccess(res, data, { meta: { total: data.length } });
};

exports.create = async (req, res) => {
  try {
    const club = await clubsService.createClub(req.body, req.file);
    return sendSuccess(res, club, { status: 201, message: 'Club créé avec succès!' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la création du club - Veuillez réessayer');
  }
};

exports.update = async (req, res) => {
  try {
    const club = await clubsService.updateClub(req.params.id, req.body, req.file);
    if (!club) return sendError(res, 404, 'NOT_FOUND', 'Club non trouvé - Impossible de modifier ce club');
    return sendSuccess(res, club, { message: 'Club modifié avec succès!' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la mise à jour du club - Veuillez réessayer');
  }
};

exports.remove = async (req, res) => {
  try {
    const ok = await clubsService.deleteClub(req.params.id);
    if (!ok) return sendError(res, 404, 'NOT_FOUND', 'Club non trouvé');
    return sendSuccess(res, null, { message: 'Club supprimé avec succès!' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la suppression du club');
  }
};
