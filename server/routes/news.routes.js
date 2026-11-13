const express = require('express');
const router = express.Router();

const { News, Club } = require('../models');
const { upload } = require('../config/upload');
const { getCachedData, setCachedData, clearCache } = require('../utils/cache');
const { pickFields } = require('../utils/sanitize');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { asyncWrapper } = require('../middleware/errorHandler');

const newsUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 }
]);

// GET /api/news (public, cached 30s)
router.get('/', asyncWrapper(async (req, res) => {
  const cacheKey = 'news';
  const cachedNews = getCachedData(cacheKey);

  if (cachedNews) {
    return res.json({
      success: true,
      data: cachedNews,
      cached: true
    });
  }

  const news = await News.findAll({
    order: [['createdAt', 'DESC']],
    include: [{
      model: Club,
      as: 'club',
      attributes: ['id', 'club', 'president'],
      required: false
    }]
  });

  setCachedData(cacheKey, news);
  res.json({
    success: true,
    data: news,
    count: news.length
  });
}));

// POST /api/news (admin)
router.post('/', authMiddleware, adminMiddleware, newsUpload, async (req, res) => {
  try {
    const newsData = pickFields(req.body, 'news');

    // Handle special organizer values
    if (newsData.clubId === 'adei' || newsData.clubId === 'ensa') {
      newsData.organizer = newsData.clubId === 'adei' ? 'ADEI' : 'Administration ENSA Fès';
      newsData.clubId = null;
    }

    if (newsData.clubId === '' || newsData.clubId === 'null' || newsData.clubId === 'undefined') {
      newsData.clubId = null;
    }

    if (newsData.clubId && !isNaN(newsData.clubId)) {
      newsData.clubId = parseInt(newsData.clubId, 10);
    }

    if (req.files) {
      if (req.files.image) {
        newsData.image = `/uploads/${req.files.image[0].filename}`;
      }
      if (req.files.document) {
        newsData.document = `/uploads/${req.files.document[0].filename}`;
      }
    }

    const news = await News.create(newsData);
    clearCache('news');

    res.status(201).json({
      success: true,
      message: 'Actualité créée avec succès!',
      news: news
    });
  } catch (error) {
    console.error('Error creating news:', error.message);
    res.status(500).json({
      success: false,
      message: `Erreur lors de la création de l'actualité: ${error.message}`
    });
  }
});

// PUT /api/news/:id (admin)
router.put('/:id', authMiddleware, adminMiddleware, newsUpload, async (req, res) => {
  try {
    const newsData = pickFields(req.body, 'news');

    if (newsData.clubId === 'adei' || newsData.clubId === 'ensa') {
      newsData.organizer = newsData.clubId === 'adei' ? 'ADEI' : 'Administration ENSA Fès';
      newsData.clubId = null;
    }

    if (newsData.clubId === '' || newsData.clubId === 'null' || newsData.clubId === 'undefined') {
      newsData.clubId = null;
    }

    if (newsData.clubId && !isNaN(newsData.clubId)) {
      newsData.clubId = parseInt(newsData.clubId, 10);
    }

    if (req.files) {
      if (req.files.image) {
        newsData.image = `/uploads/${req.files.image[0].filename}`;
      }
      if (req.files.document) {
        newsData.document = `/uploads/${req.files.document[0].filename}`;
      }
    }

    const [updated] = await News.update(newsData, { where: { id: req.params.id } });
    if (updated) {
      const news = await News.findByPk(req.params.id);
      clearCache('news');
      res.json({
        success: true,
        message: 'Actualité modifiée avec succès!',
        news: news
      });
    } else {
      res.status(404).json({ message: 'Actualité non trouvée' });
    }
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'actualité' });
  }
});

// DELETE /api/news/:id (admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const deleted = await News.destroy({ where: { id: req.params.id } });
    if (deleted) {
      clearCache('news');
      res.json({ success: true, message: 'Actualité supprimée' });
    } else {
      res.status(404).json({ message: 'Actualité non trouvée' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'actualité' });
  }
});

// PATCH /api/news/:id/reorder (admin)
router.patch('/:id/reorder', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body;

    const currentNews = await News.findByPk(id);
    if (!currentNews) {
      return res.status(404).json({ message: 'Actualité non trouvée' });
    }

    const allNews = await News.findAll({ order: [['createdAt', 'DESC']] });
    const currentIndex = allNews.findIndex(news => news.id == id);

    if (currentIndex === -1) {
      return res.status(404).json({ message: 'Actualité non trouvée dans la liste' });
    }

    let targetIndex;
    if (direction === 'up' && currentIndex > 0) {
      targetIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < allNews.length - 1) {
      targetIndex = currentIndex + 1;
    } else {
      return res.json({ success: true, message: 'Aucun changement nécessaire' });
    }

    const targetNews = allNews[targetIndex];
    const tempDate = currentNews.createdAt;

    await currentNews.update({ createdAt: targetNews.createdAt });
    await targetNews.update({ createdAt: tempDate });

    clearCache('news');
    res.json({ success: true, message: 'Ordre modifié avec succès' });
  } catch (error) {
    console.error('Erreur reorder news:', error);
    res.status(500).json({ message: 'Erreur lors de la modification de l\'ordre' });
  }
});

module.exports = router;