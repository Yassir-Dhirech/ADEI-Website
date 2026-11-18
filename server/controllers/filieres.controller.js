const filieresService = require('../services/filieres.service');
const { sendSuccess, sendError } = require('../utils/response');

exports.getAll = async (req, res) => {
  const data = await filieresService.listFilieres();
  return sendSuccess(res, data, { meta: { total: data.length } });
};

exports.create = async (req, res) => {
  try {
    const filiere = await filieresService.createFiliere(req.body);
    return sendSuccess(res, filiere, { status: 201, message: 'Filière créée avec succès!' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la création de la filière - Veuillez réessayer');
  }
};

exports.update = async (req, res) => {
  try {
    const filiere = await filieresService.updateFiliere(req.params.id, req.body);
    if (!filiere) return sendError(res, 404, 'NOT_FOUND', 'Filière non trouvée - Impossible de modifier cette filière');
    return sendSuccess(res, filiere, { message: 'Filière modifiée avec succès!' });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 400, 'CONFLICT', 'Cette abréviation existe déjà. Veuillez choisir une autre abréviation.');
    }
    if (error.name === 'SequelizeValidationError') {
      return sendError(res, 400, 'VALIDATION_ERROR', `Erreur de validation: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la mise à jour de la filière - Veuillez réessayer');
  }
};

exports.remove = async (req, res) => {
  try {
    const ok = await filieresService.deleteFiliere(req.params.id);
    if (!ok) return sendError(res, 404, 'NOT_FOUND', 'Filière non trouvée');
    return sendSuccess(res, null, { message: 'Filière supprimée' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la suppression de la filière');
  }
};
