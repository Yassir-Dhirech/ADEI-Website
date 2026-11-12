const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { authMiddleware, adminMiddleware, JWT_SECRET } = require('./middleware/auth');

const UPLOAD_DIR = path.resolve(__dirname, 'uploads');

const safeDeleteUpload = (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string' || fileUrl === '/images/default.jpg') {
    return;
  }
  const relativePath = fileUrl.replace(/^\/+/, '');
  const resolvedPath = path.resolve(__dirname, relativePath);
  if (resolvedPath.startsWith(UPLOAD_DIR + path.sep) && fs.existsSync(resolvedPath)) {
    fs.unlinkSync(resolvedPath);
  }
};

// Import API interface with error handling
let getApiInterface;
try {
  const apiInterface = require('./api-interface');
  getApiInterface = apiInterface.getApiInterface;
} catch (error) {
  console.error('Warning: Could not load api-interface module:', error.message);
  // Create a fallback function
  getApiInterface = (PORT) => {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API ADEI ENSA Fès</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #000; color: #fff; }
        h1 { color: #dc2626; }
        .status { background: #dc2626; color: white; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>API ADEI ENSA Fès</h1>
    <div class="status">API Opérationnelle - Port ${PORT}</div>
    <p>Interface de programmation pour l'Association des Étudiants Ingénieurs</p>
    <p>Endpoints disponibles:</p>
    <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
        <li>GET /api/news - Actualités</li>
        <li>GET /api/events - Événements</li>
        <li>GET /api/clubs - Clubs</li>
        <li>GET /api/filieres - Filières</li>
        <li>GET /api/feedbacks/public - Feedbacks</li>
        <li>GET /health - Status</li>
    </ul>
</body>
</html>
    `;
  };
}

// Fonctions de gestion d'erreurs intégrées
const handleApiError = (error, context = '') => {
  console.error(`API Error in ${context}:`, {
    message: error.message,
    stack: error.stack,
    name: error.name
  });

  // Message générique pour les utilisateurs
  return {
    success: false,
    message: 'Service temporairement indisponible. Veuillez réessayer plus tard.',
    code: 'SERVICE_ERROR'
  };
};

const asyncWrapper = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      const context = `${req.method} ${req.path}`;
      const errorResponse = handleApiError(error, context);
      res.status(500).json(errorResponse);
    });
  };
};

// Import Sequelize models with associations
const sequelize = require('./config/database');
const { Op } = require('sequelize');
const models = require('./models');
const { User, News, Event, Club, Feedback, ADEIMember, Filiere, Partner } = models;


// Field whitelists to prevent mass assignment
const ALLOWED_FIELDS = {
  news: ['title', 'content', 'date', 'clubId', 'organizer', 'image', 'document', 'link', 'category', 'order_display'],
  events: ['title', 'description', 'date', 'time', 'location', 'category', 'clubId', 'organizer', 'image', 'document', 'link'],
  clubs: ['club', 'president', 'annees_etude', 'tel', 'email', 'website', 'image', 'description', 'activities', 'achievements', 'members', 'facebook', 'instagram', 'linkedin'],
  feedbacks: ['name', 'email', 'type', 'message'],
  'adei-members': ['name', 'role', 'email', 'photo'],
  partners: ['name', 'description', 'website', 'logo', 'facebook', 'instagram', 'whatsapp', 'isActive', 'order_display'],
  filieres: ['name', 'abbreviation', 'type', 'documentation', 'drive', 'description', 'isActive', 'order_display', 'responsable_pedagogique', 'responsable_contact', 'delegue_cp1_a', 'tel_delegue_cp1_a', 'delegue_cp1_b', 'tel_delegue_cp1_b', 'delegue_cp1_c', 'tel_delegue_cp1_c', 'delegue_cp2_a', 'tel_delegue_cp2_a', 'delegue_cp2_b', 'tel_delegue_cp2_b', 'delegue_cp2_c', 'tel_delegue_cp2_c', 'delegue_annee1', 'tel_delegue_annee1', 'delegue_annee2', 'tel_delegue_annee2', 'delegue_annee3', 'tel_delegue_annee3'],
  users: ['username', 'email', 'password', 'role', 'is_president', 'is_representant', 'is_membre_adei', 'is_bureau_adei']
};

const pickFields = (body, type) => {
  const allowed = ALLOWED_FIELDS[type] || [];
  const result = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      result[key] = body[key];
    }
  }
  return result;
};

const app = express();
const PORT = process.env.PORT || 5001;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de tentatives de connexion, veuillez réessayer plus tard.' }
});

const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de feedbacks envoyés, veuillez réessayer plus tard.' }
});

app.use(cors({
  origin: function (origin, callback) {
    // Permettre les requêtes sans origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    // Utiliser les origins depuis les variables d'environnement ou valeurs par défaut
    const corsOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ["https://adei-ensaf.ma", "https://www.adei-ensaf.ma", "http://localhost:3000", "http://localhost:3001"];

    if (corsOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Pour supporter les anciens navigateurs
}));

// Middleware de debug CORS
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.get('Origin') || 'none'}`);
  next();
});
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Increased to 10MB
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const allowedDocTypes = /pdf|doc|docx|txt/;
    const extname = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    // Check if it's an image
    const isImage = allowedImageTypes.test(extname) && /image/.test(mimetype);

    // Check if it's a document
    const isDocument = allowedDocTypes.test(extname) &&
      (mimetype.includes('pdf') ||
        mimetype.includes('document') ||
        mimetype.includes('text') ||
        mimetype.includes('msword') ||
        mimetype.includes('wordprocessingml'));

    if (isImage || isDocument) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images (jpeg, jpg, png, gif, webp) et les documents (pdf, doc, docx, txt) sont autorisés'));
    }
  }
});

// Connexion à MySQL et synchronisation des modèles
async function connectWithRetry() {
  const maxRetries = 5; // Réduire les tentatives pour Vercel
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await sequelize.authenticate();
      console.log('MySQL connecté avec succès');

      // Synchroniser les modèles avec la base de données
      await sequelize.sync({ force: false });
      console.log('Modèles synchronisés');

      // Créer l'utilisateur admin par défaut seulement s'il n'y en a aucun
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount === 0) {
        const hashedPassword = await bcrypt.hash('password', 10);
        await User.create({
          username: 'admin',
          email: 'adei_ensa@gmail.com',
          password: hashedPassword,
          role: 'admin'
        });
        console.log('Utilisateur admin par défaut créé');
      } else {
        console.log(`${adminCount} administrateur(s) trouvé(s) dans la base de données`);
      }
      break;
    } catch (err) {
      retries++;
      console.log(`Tentative de connexion MySQL ${retries}/${maxRetries}...`);
      console.error('Erreur MySQL:', err.message);
      if (retries >= maxRetries) {
        console.error('Impossible de se connecter à MySQL après', maxRetries, 'tentatives');
        // Ne pas faire process.exit(1) sur Vercel
        break;
      }
      // Attendre 2 secondes avant de réessayer (moins que 5s)
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

connectWithRetry();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API ADEI is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Debug/test endpoints — ONLY available in development
if (process.env.NODE_ENV !== 'production') {

  // Test endpoint pour vérifier les routes API
  app.get('/api/test', (req, res) => {
    res.status(200).json({
      message: 'API routes are working',
      availableRoutes: {
        'POST /api/login': 'Authentication endpoint',
        'GET /api/clubs': 'Get clubs data',
        'GET /api/events': 'Get events data',
        'GET /api/news': 'Get news data',
        'GET /api/filieres': 'Get filieres data',
        'GET /api/feedbacks/public': 'Get public feedbacks',
        'GET /api/feedbacks/test': 'Test feedbacks connection'
      },
      timestamp: new Date().toISOString()
    });
  });

  // Test endpoint spécifique pour les feedbacks
  app.get('/api/feedbacks/test', async (req, res) => {
    try {
      console.log('=== TESTING FEEDBACKS CONNECTION ===');
      const count = await Feedback.count();
      const simpleFeedbacks = await Feedback.findAll({ limit: 1 });
      const userCount = await User.count();

      res.json({
        success: true,
        feedbackModel: typeof Feedback,
        userModel: typeof User,
        feedbackCount: count,
        userCount: userCount,
        sampleFeedback: simpleFeedbacks[0] || null
      });
    } catch (error) {
      console.error('Test error:', error);
      res.status(500).json({
        success: false,
        error: error.message
        // stack trace removed
      });
    }
  });
}

// Route pour la racine - Interface web de l'API
app.get('/', (req, res) => {
  try {
    const html = getApiInterface(PORT);
    res.send(html);
  } catch (error) {
    console.error('Error serving API interface:', error);
    // Fallback simple HTML
    res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API ADEI ENSA Fès</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #000; color: #fff; }
        h1 { color: #dc2626; margin-bottom: 20px; }
        .status { background: #dc2626; color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .endpoints { text-align: left; max-width: 600px; margin: 20px auto; }
        .endpoint { background: #1a1a1a; padding: 10px; margin: 10px 0; border-radius: 5px; border: 1px solid #333; }
        a { color: #dc2626; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>API ADEI ENSA Fès</h1>
    <div class="status">API Opérationnelle - Port ${PORT} - ${new Date().toLocaleString('fr-FR')}</div>
    <p>Interface de programmation pour l'Association des Étudiants Ingénieurs</p>
    
    <div class="endpoints">
        <h3>Endpoints Publics:</h3>
        <div class="endpoint">
            <strong>GET /api/news</strong> - Récupère toutes les actualités
            <br><a href="/api/news" target="_blank">Tester</a>
        </div>
        <div class="endpoint">
            <strong>GET /api/events</strong> - Récupère tous les événements
            <br><a href="/api/events" target="_blank">Tester</a>
        </div>
        <div class="endpoint">
            <strong>GET /api/clubs</strong> - Liste des clubs étudiants
            <br><a href="/api/clubs" target="_blank">Tester</a>
        </div>
        <div class="endpoint">
            <strong>GET /api/filieres</strong> - Informations sur les filières
            <br><a href="/api/filieres" target="_blank">Tester</a>
        </div>
        <div class="endpoint">
            <strong>GET /api/feedbacks/public</strong> - Feedbacks publics
            <br><a href="/api/feedbacks/public" target="_blank">Tester</a>
        </div>
        <div class="endpoint">
            <strong>GET /api/adei-members</strong> - Membres du bureau ADEI
            <br><a href="/api/adei-members" target="_blank">Tester</a>
        </div>
        <div class="endpoint">
            <strong>GET /health</strong> - Vérification de l'état de l'API
            <br><a href="/health" target="_blank">Tester</a>
        </div>
        <div class="endpoint">
            <strong>GET /api/test</strong> - Test général des routes
            <br><a href="/api/test" target="_blank">Tester</a>
        </div>
    </div>
    
    <p style="margin-top: 40px; color: #666;">
        © 2026 ADEI ENSA Fès - API développée pour la communauté étudiante
    </p>
</body>
</html>
    `);
  }
});

// Routes d'authentification
app.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    const user = await User.findOne({ where: { email: email.trim() } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.post('/api/logout', (req, res) => {
  res.json({ success: true });
});

// Cache simple pour éviter les requêtes répétitives
const cache = new Map();
const CACHE_DURATION = 30000; // 30 secondes

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

const clearCache = (key) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};

// Routes News
// Public endpoint to get all news (for display on news page)
app.get('/api/news', asyncWrapper(async (req, res) => {
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

app.post('/api/news', authMiddleware, adminMiddleware, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 }
]), async (req, res) => {
  try {
    const newsData = pickFields(req.body, 'news');

    // Handle special organizer values
    if (newsData.clubId === 'adei' || newsData.clubId === 'ensa') {
      newsData.organizer = newsData.clubId === 'adei' ? 'ADEI' : 'Administration ENSA Fès';
      newsData.clubId = null;
    }

    // Convert clubId to null if empty string
    if (newsData.clubId === '' || newsData.clubId === 'null' || newsData.clubId === 'undefined') {
      newsData.clubId = null;
    }

    // Convert clubId to integer if it's a valid number
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

app.put('/api/news/:id', authMiddleware, adminMiddleware, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 }
]), async (req, res) => {
  try {
    const newsData = pickFields(req.body, 'news');

    // Handle special organizer values
    if (newsData.clubId === 'adei' || newsData.clubId === 'ensa') {
      newsData.organizer = newsData.clubId === 'adei' ? 'ADEI' : 'Administration ENSA Fès';
      newsData.clubId = null;
    }

    // Convert clubId to null if empty string
    if (newsData.clubId === '' || newsData.clubId === 'null' || newsData.clubId === 'undefined') {
      newsData.clubId = null;
    }

    // Convert clubId to integer if it's a valid number
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

app.delete('/api/news/:id', authMiddleware, adminMiddleware, async (req, res) => {
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

// Routes Events
app.get('/api/events', asyncWrapper(async (req, res) => {
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

app.post('/api/events', authMiddleware, adminMiddleware, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 }
]), async (req, res) => {
  try {
    const eventData = pickFields(req.body, 'events');

    // Handle special organizer values
    if (eventData.clubId === 'adei' || eventData.clubId === 'ensa') {
      eventData.organizer = eventData.clubId === 'adei' ? 'ADEI' : 'Administration ENSA Fès';
      eventData.clubId = null;
    }

    // Convert clubId to null if empty string
    if (eventData.clubId === '' || eventData.clubId === 'null' || eventData.clubId === 'undefined') {
      eventData.clubId = null;
    }

    // Convert clubId to integer if it's a valid number
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

app.put('/api/events/:id', authMiddleware, adminMiddleware, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 }
]), async (req, res) => {
  try {
    const eventData = pickFields(req.body, 'events');

    // Handle special organizer values
    if (eventData.clubId === 'adei' || eventData.clubId === 'ensa') {
      eventData.organizer = eventData.clubId === 'adei' ? 'ADEI' : 'Administration ENSA Fès';
      eventData.clubId = null;
    }

    // Convert clubId to null if empty string
    if (eventData.clubId === '' || eventData.clubId === 'null' || eventData.clubId === 'undefined') {
      eventData.clubId = null;
    }

    // Convert clubId to integer if it's a valid number
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

app.delete('/api/events/:id', authMiddleware, adminMiddleware, async (req, res) => {
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

// Routes Clubs
app.get('/api/clubs', asyncWrapper(async (req, res) => {
  try {
    console.log('🏢 Fetching clubs from database...');

    // Use Sequelize to fetch clubs - safer than raw queries
    const clubs = await Club.findAll({
      order: [['createdAt', 'DESC']]
    });

    // Transform the data to match frontend expectations
    const transformedClubs = clubs.map(club => {
      let activitiesArray = [];
      let achievementsArray = [];

      // Parse activities if it's JSON, otherwise treat as text
      if (club.activities) {
        try {
          activitiesArray = Array.isArray(club.activities) ? club.activities : JSON.parse(club.activities);
        } catch (e) {
          activitiesArray = typeof club.activities === 'string'
            ? club.activities.split(',').map(item => item.trim()).filter(item => item)
            : [];
        }
      }

      // Parse achievements if it's JSON, otherwise treat as text
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

app.post('/api/clubs', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const clubData = pickFields(req.body, 'clubs');
    if (req.file) {
      clubData.image = `/uploads/${req.file.filename}`;
    }

    // Ensure members is a number
    if (clubData.members) {
      clubData.members = parseInt(clubData.members) || 0;
    }

    // Activities and achievements are stored as text (JSON string or comma-separated)
    // We'll keep them as they come from the frontend, ensuring they are strings
    if (clubData.activities && typeof clubData.activities !== 'string') {
      clubData.activities = JSON.stringify(clubData.activities);
    }
    if (clubData.achievements && typeof clubData.achievements !== 'string') {
      clubData.achievements = JSON.stringify(clubData.achievements);
    }

    // Use Sequelize create for better reliability
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

app.put('/api/clubs/:id', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
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
      // Delete old image if it exists and a new one is uploaded
      safeDeleteUpload(club.image);
      clubData.image = `/uploads/${req.file.filename}`;
    }

    // Ensure members is a number
    if (clubData.members) {
      clubData.members = parseInt(clubData.members) || 0;
    }

    // Cleanup arrays
    if (clubData.activities && typeof clubData.activities !== 'string') {
      clubData.activities = JSON.stringify(clubData.activities);
    }
    if (clubData.achievements && typeof clubData.achievements !== 'string') {
      clubData.achievements = JSON.stringify(clubData.achievements);
    }

    // Use Sequelize update
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

app.delete('/api/clubs/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const club = await Club.findByPk(req.params.id);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club non trouvé'
      });
    }

    // Delete associated image file
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

// Routes Feedbacks
// Public endpoint to get all feedbacks (for display on feedbacks page)
app.get('/api/feedbacks/public', asyncWrapper(async (req, res) => {
  try {
    // Essayer d'abord avec l'association User
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
    // Fallback: récupérer sans association User si la colonne userId n'existe pas
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
      throw fallbackError; // Laisser asyncWrapper gérer l'erreur
    }
  }
}));

// Admin endpoint to get all feedbacks (with full details)
app.get('/api/feedbacks', authMiddleware, adminMiddleware, async (req, res) => {
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

app.post('/api/feedbacks', feedbackLimiter, async (req, res) => {
  try {
    const feedbackData = pickFields(req.body, 'feedbacks');

    // If there's an authorization header, try to get the user ID
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);
        // Use decoded.id instead of decoded.userId
        feedbackData.userId = decoded.id || decoded.userId;
      } catch (tokenError) {
        // Token is invalid, but we still allow anonymous feedback
      }
    }

    await Feedback.create(feedbackData);
    res.status(201).json({ success: true, message: 'Votre feedback a été envoyé avec succès!' });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi du feedback' });
  }
});

app.put('/api/feedbacks/:id/read', authMiddleware, adminMiddleware, async (req, res) => {
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

app.delete('/api/feedbacks/:id', authMiddleware, adminMiddleware, async (req, res) => {
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

// Routes Users
// Get current user profile (with badges)
app.get('/api/users/me', authMiddleware, async (req, res) => {
  try {
    console.log('=== FETCHING USER PROFILE ===');
    console.log('User from token:', req.user);

    // Use req.user.id instead of req.user.userId
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

// Password security info endpoint
app.get('/api/users/password-security', authMiddleware, async (req, res) => {
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

// Change password endpoint
app.post('/api/users/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Mot de passe actuel et nouveau mot de passe requis' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }

    // Use req.user.id from JWT token
    const userId = req.user.id || req.user.userId;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ success: false, message: 'Mot de passe actuel incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password and timestamp
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

app.get('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
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

app.post('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
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
        [Op.or]: [
          { username },
          { email }
        ]
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

app.put('/api/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
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

app.delete('/api/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
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

// Routes ADEI Members
app.get('/api/adei-members', async (req, res) => {
  try {
    const members = await ADEIMember.findAll({ order: [['createdAt', 'DESC']] });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des membres ADEI' });
  }
});

app.post('/api/adei-members', authMiddleware, adminMiddleware, upload.single('photo'), async (req, res) => {
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

app.put('/api/adei-members/:id', authMiddleware, adminMiddleware, upload.single('photo'), async (req, res) => {
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

app.delete('/api/adei-members/:id', authMiddleware, adminMiddleware, async (req, res) => {
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

// Routes Filières
app.get('/api/filieres', asyncWrapper(async (req, res) => {
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

app.post('/api/filieres', authMiddleware, adminMiddleware, async (req, res) => {
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

app.put('/api/filieres/:id', authMiddleware, adminMiddleware, async (req, res) => {
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

    // More specific error messages
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

app.delete('/api/filieres/:id', authMiddleware, adminMiddleware, async (req, res) => {
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

// Routes Partners
app.get('/api/partners', async (req, res) => {
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

app.post('/api/partners', authMiddleware, adminMiddleware, upload.single('logo'), async (req, res) => {
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

app.put('/api/partners/:id', authMiddleware, adminMiddleware, upload.single('logo'), async (req, res) => {
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

app.delete('/api/partners/:id', authMiddleware, adminMiddleware, async (req, res) => {
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

// Reorder partners
app.patch('/api/partners/:id/reorder', authMiddleware, adminMiddleware, async (req, res) => {
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

// Reorder news
app.patch('/api/news/:id/reorder', authMiddleware, adminMiddleware, async (req, res) => {
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

    // Swap the created dates to change order
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

// Reorder events
app.patch('/api/events/:id/reorder', authMiddleware, adminMiddleware, async (req, res) => {
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

    // Swap the created dates to change order
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

// Middleware global de gestion d'erreurs (doit être à la fin)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || (err.message && err.message.includes('Seules les images'))) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Erreur lors du téléchargement du fichier',
      code: 'UPLOAD_ERROR'
    });
  }
  if (err.type === 'entity.parse.failed' || err.status === 400) {
    return res.status(400).json({
      success: false,
      message: 'Requête JSON invalide',
      code: 'BAD_REQUEST'
    });
  }
  const context = `${req.method} ${req.path}`;
  const errorResponse = handleApiError(err, context);
  res.status(500).json(errorResponse);
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint non trouvé',
    code: 'NOT_FOUND'
  });
});

app.listen(PORT, () => {
  console.log(`Serveur backend démarré sur le port ${PORT}`);
});
