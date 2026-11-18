const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const adeiRolesRoutes = require('./routes/adeiRoles.routes');
const academicRoutes = require('./routes/academic.routes');


const env = require('./config/env');
const { UPLOAD_DIR } = require('./config/upload');
const { errorMiddleware, notFoundMiddleware } = require('./middleware/errorHandler');

// Import des routeurs de domaine
const filieresRoutes = require('./routes/filieres.routes');
const adeiMembersRoutes = require('./routes/adeiMembers.routes');
const partnersRoutes = require('./routes/partners.routes');
const clubsRoutes = require('./routes/clubs.routes');
const feedbacksRoutes = require('./routes/feedbacks.routes');
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const newsRoutes = require('./routes/news.routes');
const eventsRoutes = require('./routes/events.routes');

const app = express();

// Trust proxy pour les environnements de production (Nginx/Cloudflare)
if (env.TRUST_PROXY) {
  app.set('trust proxy', 1);
}

// Configuration CORS sécurisée
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

// Middlewares généraux
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(UPLOAD_DIR));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API ADEI is running',
    timestamp: new Date().toISOString()
  });
});

// Montage des routes d'API
app.use('/api', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/clubs', clubsRoutes);
app.use('/api/feedbacks', feedbacksRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/adei-members', adeiMembersRoutes);
app.use('/api/filieres', filieresRoutes);
app.use('/api/partners', partnersRoutes);
app.use('/api/adei-roles', adeiRolesRoutes);
app.use('/api/academic', academicRoutes);

// Route racine informative
app.get('/', (req, res) => {
  res.json({
    name: 'ADEI ENSA Fès API',
    status: 'operational',
    environment: env.NODE_ENV,
    endpoints: {
      health: 'GET /health',
      news: 'GET /api/news',
      events: 'GET /api/events',
      clubs: 'GET /api/clubs',
      filieres: 'GET /api/filieres',
      adeiMembers: 'GET /api/adei-members',
      partners: 'GET /api/partners'
    }
  });
});

// Middlewares d'erreurs et 404 (doivent être en dernier)
app.use(errorMiddleware);
app.use('*', notFoundMiddleware);

module.exports = app;