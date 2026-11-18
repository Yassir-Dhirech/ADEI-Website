const usersService = require('../services/users.service');

exports.getMe = async (req, res) => {
  try {
    const user = await usersService.getProfile(req.user.id || req.user.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du profil utilisateur' });
  }
};

exports.getPasswordSecurity = async (req, res) => {
  try {
    const user = await usersService.getPasswordSecurity(req.user.id || req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    res.json({ success: true, data: { lastPasswordChange: user.lastPasswordChange } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des informations de sécurité' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Mot de passe actuel et nouveau mot de passe requis' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
    }

    const result = await usersService.changePassword(req.user.id || req.user.userId, currentPassword, newPassword);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la modification du mot de passe' });
  }
};

exports.getAll = async (req, res) => {
  try {
    res.json(await usersService.listUsers());
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
};

exports.create = async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Nom d'utilisateur, email et mot de passe requis" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    const result = await usersService.createUser(req.body);
    if (result.conflict) return res.status(400).json({ message: "Ce nom d'utilisateur ou cet email existe déjà" });
    res.status(201).json(result.user);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création de l'utilisateur" });
  }
};

exports.update = async (req, res) => {
  try {
    const { password } = req.body || {};
    if (password && password.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    const user = await usersService.updateUser(req.params.id, req.body || {});
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'utilisateur" });
  }
};

exports.remove = async (req, res) => {
  try {
    const result = await usersService.deleteUser(req.params.id);
    if (result.lastAdmin) return res.status(400).json({ message: 'Impossible de supprimer le dernier administrateur' });
    if (!result.deleted) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json({ success: true, message: 'Utilisateur supprimé' });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de l'utilisateur" });
  }
};