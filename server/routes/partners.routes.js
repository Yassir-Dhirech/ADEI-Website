const express = require('express');
const router = express.Router();

const { Partner } = require('../models');
const { upload, safeDeleteUpload } = require('../config/upload');
const { pickFields } = require('../utils/sanitize');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET /api/partners
router.get('/', async (req, res) => {
  try {
    const partners = await Partner.findAll({
      where: { isActive: true },
      order: [['order_display', 'ASC'], ['name', 'ASC']]
    });
    res.json(partners);
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des partenaires' });
  }
});

// POST /api/partners
router.post('/', authMiddleware, adminMiddleware, upload.single('logo'), async (req, res) => {
  try {
    const partnerData = pickFields(req.body, 'partners');
    if (req.file) {
      partnerData.logo = `/uploads/${req.file.filename}`;
    }

    const partner = await Partner.create(partnerData);
    res.status(201).json({
      success: true,
      message: 'Partenaire créé avec succès!',
      partner: partner
    });
  } catch (error) {
    console.error('Erreur création partenaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du partenaire - Veuillez réessayer'
    });
  }
});

// PUT /api/partners/:id
router.put('/:id', authMiddleware, adminMiddleware, upload.single('logo'), async (req, res) => {
  try {
    const partnerData = pickFields(req.body, 'partners');
    if (req.file) {
      partnerData.logo = `/uploads/${req.file.filename}`;
    }

    const [updated] = await Partner.update(partnerData, { where: { id: req.params.id } });
    if (updated) {
      const partner = await Partner.findByPk(req.params.id);
      res.json({
        success: true,
        message: 'Partenaire modifié avec succès!',
        partner: partner
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Partenaire non trouvé - Impossible de modifier ce partenaire'
      });
    }
  } catch (error) {
    console.error('Erreur mise à jour partenaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du partenaire - Veuillez réessayer'
    });
  }
});

// DELETE /api/partners/:id
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const partner = await Partner.findByPk(req.params.id);
    if (partner) {
      safeDeleteUpload(partner.logo);
    }
    const deleted = await Partner.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.json({ success: true, message: 'Partenaire supprimé' });
    } else {
      res.status(404).json({ message: 'Partenaire non trouvé' });
    }
  } catch (error) {
    console.error('Erreur suppression partenaire:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du partenaire' });
  }
});

// PATCH /api/partners/:id/reorder
router.patch('/:id/reorder', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body;

    const partners = await Partner.findAll({
      where: { isActive: true },
      order: [['order_display', 'ASC'], ['name', 'ASC']]
    });

    const currentIndex = partners.findIndex(p => String(p.id) === String(id));
    if (currentIndex === -1) {
      return res.status(404).json({ message: 'Partenaire non trouvé' });
    }

    let targetIndex;
    if (direction === 'up' && currentIndex > 0) {
      targetIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < partners.length - 1) {
      targetIndex = currentIndex + 1;
    } else {
      return res.json({ success: true, message: 'Aucun changement nécessaire' });
    }

    // Normalize sequential order_display before swapping
    for (let i = 0; i < partners.length; i++) {
      if (partners[i].order_display !== i) {
        await partners[i].update({ order_display: i });
      }
    }

    await partners[currentIndex].update({ order_display: targetIndex });
    await partners[targetIndex].update({ order_display: currentIndex });

    res.json({ success: true, message: 'Ordre modifié avec succès' });
  } catch (error) {
    console.error('Erreur reorder partner:', error);
    res.status(500).json({ message: 'Erreur lors de la modification de l\'ordre' });
  }
});

module.exports = router;