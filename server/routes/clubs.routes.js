const express = require('express');
const router = express.Router();

const { Club } = require('../models');
const { upload, safeDeleteUpload } = require('../config/upload');
const { pickFields } = require('../utils/sanitize');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { asyncWrapper } = require('../middleware/errorHandler');

// GET /api/clubs
router.get('/', asyncWrapper(async (req, res) => {
  try {
    console.log('🏢 Fetching clubs from database...');

    const clubs = await Club.findAll({
      order: [['createdAt', 'DESC']]
    });

    const transformedClubs = clubs.map(club => {
      let activitiesArray = [];
      let achievementsArray = [];

      if (club.activities) {
        try {
          activitiesArray = Array.isArray(club.activities) ? club.activities : JSON.parse(club.activities);
        } catch (e) {
          activitiesArray = typeof club.activities === 'string'
            ? club.activities.split(',').map(item => item.trim()).filter(item => item)
            : [];
        }
      }

      if (club.achievements) {
        try {
          achievementsArray = Array.isArray(club.achievements) ? club.achievements : JSON.parse(club.achievements);
        } catch (e) {
          achievementsArray = typeof club.achievements === 'string'
            ? club.achievements.split(',').map(item => item.trim()).filter(item => item)
            : [];
        }
      }

      return {
        id: club.id,
        club: club.club,
        president: club.president,
        annees_etude: club.annees_etude,
        tel: club.tel,
        email: club.email,
        website: club.website || '',
        image: club.image || '',
        description: club.description || '',
        activities: activitiesArray,
        achievements: achievementsArray,
        members: club.members || 0,
        facebook: club.facebook || '',
        instagram: club.instagram || '',
        linkedin: club.linkedin || '',
        createdAt: club.createdAt,
        updatedAt: club.updatedAt,
        socialMedia: {
          facebook: club.facebook || '',
          instagram: club.instagram || '',
          linkedin: club.linkedin || ''
        }
      };
    });

    console.log(`✅ Found ${transformedClubs.length} clubs in database`);

    res.json({
      success: true,
      data: transformedClubs,
      count: transformedClubs.length,
      source: 'database'
    });
  } catch (error) {
    console.error('❌ Database error in /api/clubs:', error);
    throw error;
  }
}));

// POST /api/clubs
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const clubData = pickFields(req.body, 'clubs');
    if (req.file) {
      clubData.image = `/uploads/${req.file.filename}`;
    }

    if (clubData.members) {
      clubData.members = parseInt(clubData.members) || 0;
    }

    if (clubData.activities && typeof clubData.activities !== 'string') {
      clubData.activities = JSON.stringify(clubData.activities);
    }
    if (clubData.achievements && typeof clubData.achievements !== 'string') {
      clubData.achievements = JSON.stringify(clubData.achievements);
    }

    const newClub = await Club.create(clubData);

    res.status(201).json({
      success: true,
      message: 'Club créé avec succès!',
      club: newClub
    });
  } catch (error) {
    console.error('Erreur création club:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du club - Veuillez réessayer'
    });
  }
});

// PUT /api/clubs/:id
router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    console.log('=== DÉBUT MODIFICATION CLUB ===');
    console.log('ID du club:', req.params.id);

    const club = await Club.findByPk(req.params.id);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club non trouvé - Impossible de modifier ce club'
      });
    }

    const clubData = pickFields(req.body, 'clubs');
    if (req.file) {
      safeDeleteUpload(club.image);
      clubData.image = `/uploads/${req.file.filename}`;
    }

    if (clubData.members) {
      clubData.members = parseInt(clubData.members) || 0;
    }

    if (clubData.activities && typeof clubData.activities !== 'string') {
      clubData.activities = JSON.stringify(clubData.activities);
    }
    if (clubData.achievements && typeof clubData.achievements !== 'string') {
      clubData.achievements = JSON.stringify(clubData.achievements);
    }

    await club.update(clubData);

    res.json({
      success: true,
      message: 'Club modifié avec succès!',
      club: club
    });
  } catch (error) {
    console.error('Erreur mise à jour club:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du club - Veuillez réessayer'
    });
  }
});

// DELETE /api/clubs/:id
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const club = await Club.findByPk(req.params.id);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club non trouvé'
      });
    }

    safeDeleteUpload(club.image);
    await club.destroy();

    res.json({
      success: true,
      message: 'Club supprimé avec succès!'
    });
  } catch (error) {
    console.error('Erreur suppression club:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du club'
    });
  }
});

module.exports = router;