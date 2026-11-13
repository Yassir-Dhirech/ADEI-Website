const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const { Feedback, User } = require('../models');
const { pickFields } = require('../utils/sanitize');
const { authMiddleware, adminMiddleware, JWT_SECRET } = require('../middleware/auth');
const { asyncWrapper } = require('../middleware/errorHandler');

const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de feedbacks envoyés, veuillez réessayer plus tard.' }
});

// GET /api/feedbacks/public
router.get('/public', asyncWrapper(async (req, res) => {
  try {
    const feedbacks = await Feedback.findAll({
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'type', 'message', 'createdAt', 'userId'],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'is_president', 'is_representant', 'is_membre_adei', 'is_bureau_adei'],
        required: false
      }]
    });

    res.json({
      success: true,
      data: feedbacks,
      count: feedbacks.length
    });
  } catch (associationError) {
    try {
      const simpleFeedbacks = await Feedback.findAll({
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'name', 'type', 'message', 'createdAt']
      });

      res.json({
        success: true,
        data: simpleFeedbacks,
        count: simpleFeedbacks.length,
        note: 'Données utilisateur non disponibles'
      });
    } catch (fallbackError) {
      throw fallbackError;
    }
  }
}));

// GET /api/feedbacks (admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const feedbacks = await Feedback.findAll({
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'is_president', 'is_representant', 'is_membre_adei', 'is_bureau_adei'],
        required: false
      }]
    });
    res.json(feedbacks);
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des feedbacks' });
  }
});

// POST /api/feedbacks
router.post('/', feedbackLimiter, async (req, res) => {
  try {
    const feedbackData = pickFields(req.body, 'feedbacks');

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);
        feedbackData.userId = decoded.id || decoded.userId;
      } catch (tokenError) {
        // Token is invalid, still allow anonymous feedback
      }
    }

    await Feedback.create(feedbackData);
    res.status(201).json({ success: true, message: 'Votre feedback a été envoyé avec succès!' });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi du feedback' });
  }
});

// PUT /api/feedbacks/:id/read
router.put('/:id/read', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [updated] = await Feedback.update({ read: true }, { where: { id: req.params.id } });
    if (updated) {
      const feedback = await Feedback.findByPk(req.params.id);
      res.json(feedback);
    } else {
      res.status(404).json({ message: 'Feedback non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du feedback' });
  }
});

// DELETE /api/feedbacks/:id
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const deleted = await Feedback.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.json({ success: true, message: 'Feedback supprimé' });
    } else {
      res.status(404).json({ message: 'Feedback non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du feedback' });
  }
});

module.exports = router;