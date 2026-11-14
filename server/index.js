const env = require('./config/env');
const filieresRoutes = require('./routes/filieres.routes');
const adeiMembersRoutes = require('./routes/adeiMembers.routes');
const partnersRoutes = require('./routes/partners.routes');
const clubsRoutes = require('./routes/clubs.routes');
const feedbacksRoutes = require('./routes/feedbacks.routes');
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const newsRoutes = require('./routes/news.routes');
const eventsRoutes = require('./routes/events.routes');

const express = require('express');
const cors = require('cors');


const { UPLOAD_DIR } = require('./config/upload');
const { errorMiddleware, notFoundMiddleware } = require('./middleware/errorHandler');

// Import Sequelize models
const sequelize = require('./config/database');
const { User, Feedback } = require('./models');
const app = express();
const PORT = env.PORT || 5001;


// Trust first proxy hop if enabled (for accurate client IPs behind Nginx/Cloudflare)
if (env.TRUST_PROXY) {
  app.set('trust proxy', 1);
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (env.isDevelopment && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    if (env.CORS_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Middleware de debug CORS
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.get('Origin') || 'none'}`);
  next();
});
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));


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
if (env.isDevelopment) {

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

// Route racine - Statut API
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API ADEI ENSA Fès is operational',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      news: '/api/news',
      events: '/api/events',
      clubs: '/api/clubs',
      filieres: '/api/filieres',
      feedbacks: '/api/feedbacks/public'
    }
  });
});

// Routes d'authentification
app.use('/api', authRoutes);

//Routes news
app.use('/api/news', newsRoutes);

//Routes events
app.use('/api/events', eventsRoutes);

// Routes Clubs
app.use('/api/clubs', clubsRoutes);

// Routes Feedbacks
app.use('/api/feedbacks', feedbacksRoutes);

// Routes Users
app.use('/api/users', usersRoutes);

// Routes ADEI Members
app.use('/api/adei-members', adeiMembersRoutes);

// Routes Filières
app.use('/api/filieres', filieresRoutes);

// Routes Partners
app.use('/api/partners', partnersRoutes);

// Middleware global de gestion d'erreurs et 404 (doivent être à la fin)
app.use(errorMiddleware);
app.use('*', notFoundMiddleware);

app.listen(PORT, () => {
  console.log(`Serveur backend démarré sur le port ${PORT}`);
});
