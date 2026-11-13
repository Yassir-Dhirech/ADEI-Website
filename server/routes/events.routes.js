const express = require('express');
const router = express.Router();

const { Event, Club } = require('../models');
const { upload } = require('../config/upload');
const { getCachedData, setCachedData, clearCache } = require('../utils/cache');
const { pickFields } = require('../utils/sanitize');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { asyncWrapper } = require('../middleware/errorHandler');

const eventUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 }
]);

// GET /api/events (public, cached 30s)
router.get('/', asyncWrapper(async (req, res) => {
  const cacheKey = 'events';
  const cachedEvents = getCachedData(cacheKey);

  if (cachedEvents) {
    return res.json({
      success: true,
      data: cachedEvents,
      cached: true
    });
  }

  const events = await Event.findAll({
    order: [['createdAt', 'DESC']],
    include: [{
      model: Club,
      as: 'club',
      attributes: ['id', 'club', 'president'],
      required: false
    }]
  });

  setCachedData(cacheKey, events);
  res.json({
    success: true,
    data: events,
    count: events.length
  });
}));

// POST /api/events (admin)
router.post('/', authMiddleware, adminMiddleware, eventUpload, async (req, res) => {
  try {
    const eventData = pickFields(req.body, 'events');

    if (eventData.clubId === 'adei' || eventData.clubId === 'ensa') {
      eventData.organizer = eventData.clubId === 'adei' ? 'ADEI' : 'Administration ENSA Fès';
      eventData.clubId = null;
    }

    if (eventData.clubId === '' || eventData.clubId === 'null' || eventData.clubId === 'undefined') {
      eventData.clubId = null;
    }

    if (eventData.clubId && !isNaN(eventData.clubId)) {
      eventData.clubId = parseInt(eventData.clubId, 10);
    }

    if (req.files) {
      if (req.files.image) {
        eventData.image = `/uploads/${req.files.image[0].filename}`;
      }
      if (req.files.document) {
        eventData.document = `/uploads/${req.files.document[0].filename}`;
      }
    }

    const event = await Event.create(eventData);
    clearCache('events');

    res.status(201).json({
      success: true,
      message: 'Événement créé avec succès!',
      event: event
    });
  } catch (error) {
    console.error('Error creating event:', error.message);
    res.status(500).json({
      success: false,
      message: `Erreur lors de la création de l'événement: ${error.message}`
    });
  }
});

// PUT /api/events/:id (admin)
router.put('/:id', authMiddleware, adminMiddleware, eventUpload, async (req, res) => {
  try {
    const eventData = pickFields(req.body, 'events');

    if (eventData.clubId === 'adei' || eventData.clubId === 'ensa') {
      eventData.organizer = eventData.clubId === 'adei' ? 'ADEI' : 'Administration ENSA Fès';
      eventData.clubId = null;
    }

    if (eventData.clubId === '' || eventData.clubId === 'null' || eventData.clubId === 'undefined') {
      eventData.clubId = null;
    }

    if (eventData.clubId && !isNaN(eventData.clubId)) {
      eventData.clubId = parseInt(eventData.clubId, 10);
    }

    if (req.files) {
      if (req.files.image) {
        eventData.image = `/uploads/${req.files.image[0].filename}`;
      }
      if (req.files.document) {
        eventData.document = `/uploads/${req.files.document[0].filename}`;
      }
    }

    const [updated] = await Event.update(eventData, { where: { id: req.params.id } });
    if (updated) {
      const event = await Event.findByPk(req.params.id);
      clearCache('events');
      res.json({
        success: true,
        message: 'Événement modifié avec succès!',
        event: event
      });
    } else {
      res.status(404).json({ message: 'Événement non trouvé' });
    }
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'événement' });
  }
});

// DELETE /api/events/:id (admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const deleted = await Event.destroy({ where: { id: req.params.id } });
    if (deleted) {
      clearCache('events');
      res.json({ success: true, message: 'Événement supprimé' });
    } else {
      res.status(404).json({ message: 'Événement non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'événement' });
  }
});

// PATCH /api/events/:id/reorder (admin)
router.patch('/:id/reorder', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body;

    const currentEvent = await Event.findByPk(id);
    if (!currentEvent) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    const allEvents = await Event.findAll({ order: [['createdAt', 'DESC']] });
    const currentIndex = allEvents.findIndex(event => event.id == id);

    if (currentIndex === -1) {
      return res.status(404).json({ message: 'Événement non trouvé dans la liste' });
    }

    let targetIndex;
    if (direction === 'up' && currentIndex > 0) {
      targetIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < allEvents.length - 1) {
      targetIndex = currentIndex + 1;
    } else {
      return res.json({ success: true, message: 'Aucun changement nécessaire' });
    }

    const targetEvent = allEvents[targetIndex];
    const tempDate = currentEvent.createdAt;

    await currentEvent.update({ createdAt: targetEvent.createdAt });
    await targetEvent.update({ createdAt: tempDate });

    clearCache('events');
    res.json({ success: true, message: 'Ordre modifié avec succès' });
  } catch (error) {
    console.error('Erreur reorder events:', error);
    res.status(500).json({ message: 'Erreur lors de la modification de l\'ordre' });
  }
});

module.exports = router;