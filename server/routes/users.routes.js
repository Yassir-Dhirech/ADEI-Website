const express = require('express');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const router = express.Router();

const { User } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET /api/users/me (current user profile with badges)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    console.log('=== FETCHING USER PROFILE ===');
    console.log('User from token:', req.user);

    const userId = req.user.id || req.user.userId;
    console.log('User ID:', userId);

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    console.log('User found:', user.toJSON());
    res.json(user);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du profil utilisateur' });
  }
});

// GET /api/users/password-security
router.get('/password-security', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const user = await User.findByPk(userId, {
      attributes: ['id', 'lastPasswordChange']
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    res.json({
      success: true,
      data: { lastPasswordChange: user.lastPasswordChange }
    });
  } catch (error) {
    console.error('Error fetching password security:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des informations de sécurité' });
  }
});

// POST /api/users/change-password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Mot de passe actuel et nouveau mot de passe requis' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }

    const userId = req.user.id || req.user.userId;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ success: false, message: 'Mot de passe actuel incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await user.update({
      password: hashedNewPassword,
      lastPasswordChange: new Date()
    });

    res.json({ success: true, message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la modification du mot de passe' });
  }
});

// GET /api/users (admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
});

// POST /api/users (admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      role,
      is_president,
      is_representant,
      is_membre_adei,
      is_bureau_adei
    } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Nom d\'utilisateur, email et mot de passe requis' });
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Ce nom d\'utilisateur ou cet email existe déjà' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'user',
      is_president: Boolean(is_president),
      is_representant: Boolean(is_representant),
      is_membre_adei: Boolean(is_membre_adei),
      is_bureau_adei: Boolean(is_bureau_adei)
    });

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
  }
});

// PUT /api/users/:id (admin)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { username, email, password, role, is_president, is_representant, is_membre_adei, is_bureau_adei } = req.body || {};
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (role === 'user' || role === 'admin') updateData.role = role;

    if (typeof is_president === 'boolean') updateData.is_president = is_president;
    if (typeof is_representant === 'boolean') updateData.is_representant = is_representant;
    if (typeof is_membre_adei === 'boolean') updateData.is_membre_adei = is_membre_adei;
    if (typeof is_bureau_adei === 'boolean') updateData.is_bureau_adei = is_bureau_adei;

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
      updateData.lastPasswordChange = new Date();
    }

    const [updated] = await User.update(updateData, { where: { id: req.params.id } });

    if (updated) {
      const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
      res.json(user);
    } else {
      res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
});

// DELETE /api/users/:id (admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (user && user.role === 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Impossible de supprimer le dernier administrateur' });
      }
    }

    const deleted = await User.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.json({ success: true, message: 'Utilisateur supprimé' });
    } else {
      res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
  }
});

module.exports = router;