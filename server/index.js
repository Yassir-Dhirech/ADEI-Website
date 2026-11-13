require('dotenv').config();
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
const bcrypt = require('bcryptjs');


const { UPLOAD_DIR } = require('./config/upload');
const { errorMiddleware, notFoundMiddleware } = require('./middleware/errorHandler');



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




// Import Sequelize models
const sequelize = require('./config/database');
const { User, Feedback } = require('./models');
const app = express();
const PORT = process.env.PORT || 5001;





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
