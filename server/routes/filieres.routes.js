const express = require('express');
const router = express.Router();

const { Filiere } = require('../models');
const { pickFields } = require('../utils/sanitize');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { asyncWrapper } = require('../middleware/errorHandler');

// GET /api/filieres
router.get('/', asyncWrapper(async (req, res) => {
  const filieres = await Filiere.findAll({
    where: { isActive: true },
    order: [['order_display', 'ASC'], ['abbreviation', 'ASC']]
  });
  res.json({
    success: true,
    data: filieres,
    count: filieres.length
  });
}));

// POST /api/filieres
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const filiere = await Filiere.create(pickFields(req.body, 'filieres'));
    res.status(201).json({
      success: true,
      message: 'Filière créée avec succès!',
      filiere: filiere
    });
  } catch (error) {
    console.error('Erreur création filière:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la filière - Veuillez réessayer'
    });
  }
});

// PUT /api/filieres/:id
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('Updating filière with ID:', req.params.id);
    console.log('Update data:', req.body);

    const [updated] = await Filiere.update(pickFields(req.body, 'filieres'), { where: { id: req.params.id } });

    if (updated) {
      const filiere = await Filiere.findByPk(req.params.id);
      console.log('Filière updated successfully:', filiere.name);
      res.json({
        success: true,
        message: 'Filière modifiée avec succès!',
        filiere: filiere
      });
    } else {
      console.log('Filière not found with ID:', req.params.id);
      res.status(404).json({
        success: false,
        message: 'Filière non trouvée - Impossible de modifier cette filière'
      });
    }
  } catch (error) {
    console.error('Erreur mise à jour filière:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      sql: error.sql
    });

    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({
        success: false,
        message: 'Cette abréviation existe déjà. Veuillez choisir une autre abréviation.'
      });
    } else if (error.name === 'SequelizeValidationError') {
      res.status(400).json({
        success: false,
        message: `Erreur de validation: ${error.errors.map(e => e.message).join(', ')}`
      });
    } else if (error.name === 'SequelizeDatabaseError') {
      res.status(500).json({
        success: false,
        message: 'Erreur de base de données. Vérifiez les données saisies.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la filière - Veuillez réessayer'
      });
    }
  }
});

// DELETE /api/filieres/:id
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const deleted = await Filiere.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.json({ success: true, message: 'Filière supprimée' });
    } else {
      res.status(404).json({ message: 'Filière non trouvée' });
    }
  } catch (error) {
    console.error('Erreur suppression filière:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la filière' });
  }
});

module.exports = router;