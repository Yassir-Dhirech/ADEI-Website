const usersService = require('../services/users.service');
const { sendSuccess, sendError } = require('../utils/response');

exports.getMe = async (req, res) => {
  try {
    const user = await usersService.getProfile(req.user.id || req.user.userId);
    if (!user) return sendError(res, 404, 'NOT_FOUND', 'Utilisateur non trouvé');
    return sendSuccess(res, user);
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la récupération du profil utilisateur');
  }
};

exports.getPasswordSecurity = async (req, res) => {
  try {
    const user = await usersService.getPasswordSecurity(req.user.id || req.user.userId);
    if (!user) return sendError(res, 404, 'NOT_FOUND', 'Utilisateur non trouvé');
    return sendSuccess(res, { lastPasswordChange: user.lastPasswordChange });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la récupération des informations de sécurité');
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await usersService.changePassword(req.user.id || req.user.userId, currentPassword, newPassword);
    if (!result.ok) {
      return sendError(res, result.status, result.status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST', result.message);
    }
    return sendSuccess(res, null, { message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la modification du mot de passe');
  }
};

exports.getAll = async (req, res) => {
  try {
    const users = await usersService.listUsers();
    return sendSuccess(res, users, { meta: { total: users.length } });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Erreur lors de la récupération des utilisateurs');
  }
};

exports.create = async (req, res) => {
  try {
    const result = await usersService.createUser(req.body);
    if (result.conflict) return sendError(res, 400, 'CONFLICT', "Ce nom d'utilisateur ou cet email existe déjà");
    return sendSuccess(res, result.user, { status: 201, message: 'Utilisateur créé avec succès!' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la création de l'utilisateur");
  }
};

exports.update = async (req, res) => {
  try {
    const user = await usersService.updateUser(req.params.id, req.body);
    if (!user) return sendError(res, 404, 'NOT_FOUND', 'Utilisateur non trouvé');
    return sendSuccess(res, user, { message: 'Utilisateur modifié avec succès!' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la mise à jour de l'utilisateur");
  }
};

exports.remove = async (req, res) => {
  try {
    const result = await usersService.deleteUser(req.params.id);
    if (result.lastAdmin) return sendError(res, 400, 'BAD_REQUEST', 'Impossible de supprimer le dernier administrateur');
    if (!result.deleted) return sendError(res, 404, 'NOT_FOUND', 'Utilisateur non trouvé');
    return sendSuccess(res, null, { message: 'Utilisateur supprimé' });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', "Erreur lors de la suppression de l'utilisateur");
  }
};
