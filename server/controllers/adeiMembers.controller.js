const membersService = require('../services/adeiMembers.service');
const { sendSuccess, sendError } = require('../utils/response');

exports.getAll = async (req, res) => {
  try {
    const data = await membersService.listMembers();
    return sendSuccess(res, data, { meta: { total: data.length } });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la récupération des membres ADEI');
  }
};

exports.create = async (req, res) => {
  try {
    const member = await membersService.createMember(req.body, req.file);
    return sendSuccess(res, member, { status: 201, message: 'Membre ADEI créé avec succès!' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la création du membre ADEI');
  }
};

exports.update = async (req, res) => {
  try {
    const member = await membersService.updateMember(req.params.id, req.body, req.file);
    if (!member) return sendError(res, 404, 'NOT_FOUND', 'Membre ADEI non trouvé');
    return sendSuccess(res, member, { message: 'Membre ADEI modifié avec succès!' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la mise à jour du membre ADEI');
  }
};

exports.remove = async (req, res) => {
  try {
    const ok = await membersService.deleteMember(req.params.id);
    if (!ok) return sendError(res, 404, 'NOT_FOUND', 'Membre ADEI non trouvé');
    return sendSuccess(res, null, { message: 'Membre ADEI supprimé' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la suppression du membre ADEI');
  }
};
