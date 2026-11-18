const partnersService = require('../services/partners.service');
const { sendSuccess, sendError } = require('../utils/response');

exports.getAll = async (req, res) => {
  try {
    const data = await partnersService.listPartners();
    return sendSuccess(res, data, { meta: { total: data.length } });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la récupération des partenaires');
  }
};

exports.create = async (req, res) => {
  try {
    const partner = await partnersService.createPartner(req.body, req.file);
    return sendSuccess(res, partner, { status: 201, message: 'Partenaire créé avec succès!' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la création du partenaire - Veuillez réessayer');
  }
};

exports.update = async (req, res) => {
  try {
    const partner = await partnersService.updatePartner(req.params.id, req.body, req.file);
    if (!partner) return sendError(res, 404, 'NOT_FOUND', 'Partenaire non trouvé - Impossible de modifier ce partenaire');
    return sendSuccess(res, partner, { message: 'Partenaire modifié avec succès!' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la mise à jour du partenaire - Veuillez réessayer');
  }
};

exports.remove = async (req, res) => {
  try {
    const ok = await partnersService.deletePartner(req.params.id);
    if (!ok) return sendError(res, 404, 'NOT_FOUND', 'Partenaire non trouvé');
    return sendSuccess(res, null, { message: 'Partenaire supprimé' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la suppression du partenaire');
  }
};

exports.reorder = async (req, res) => {
  try {
    const result = await partnersService.reorderPartner(req.params.id, req.body.direction);
    if (result.notFound) return sendError(res, 404, 'NOT_FOUND', 'Partenaire non trouvé');
    const message = result.unchanged ? 'Aucun changement nécessaire' : 'Ordre modifié avec succès';
    return sendSuccess(res, null, { message });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la modification de l'ordre");
  }
};
