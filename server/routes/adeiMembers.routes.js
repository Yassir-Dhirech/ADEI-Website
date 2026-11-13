const express = require('express');
const router = express.Router();

const { ADEIMember } = require('../models');
const { upload, safeDeleteUpload } = require('../config/upload');
const { pickFields } = require('../utils/sanitize');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET /api/adei-members
router.get('/', async (req, res) => {
  try {
    const members = await ADEIMember.findAll({ order: [['createdAt', 'DESC']] });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des membres ADEI' });
  }
});

// POST /api/adei-members
router.post('/', authMiddleware, adminMiddleware, upload.single('photo'), async (req, res) => {
  try {
    const memberData = pickFields(req.body, 'adei-members');
    if (req.file) {
      memberData.photo = `/uploads/${req.file.filename}`;
    }
    const member = await ADEIMember.create(memberData);
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du membre ADEI' });
  }
});

// PUT /api/adei-members/:id
router.put('/:id', authMiddleware, adminMiddleware, upload.single('photo'), async (req, res) => {
  try {
    const memberData = pickFields(req.body, 'adei-members');
    if (req.file) {
      memberData.photo = `/uploads/${req.file.filename}`;
    }
    const [updated] = await ADEIMember.update(memberData, { where: { id: req.params.id } });
    if (updated) {
      const member = await ADEIMember.findByPk(req.params.id);
      res.json(member);
    } else {
      res.status(404).json({ message: 'Membre ADEI non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du membre ADEI' });
  }
});

// DELETE /api/adei-members/:id
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const member = await ADEIMember.findByPk(req.params.id);
    if (member) {
      safeDeleteUpload(member.photo);
    }
    const deleted = await ADEIMember.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.json({ success: true, message: 'Membre ADEI supprimé' });
    } else {
      res.status(404).json({ message: 'Membre ADEI non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du membre ADEI' });
  }
});

module.exports = router;