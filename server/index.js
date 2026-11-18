const app = require('./app');
const env = require('./config/env');
const sequelize = require('./config/database');

const PORT = env.PORT || 5001;

// Connexion et synchronisation avec la base de données
async function startServer() {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await sequelize.authenticate();
      console.log(`Base de données (${sequelize.getDialect()}) connectée avec succès`);
      break;
    } catch (err) {
      retries++;
      console.log(`Tentative de connexion (${sequelize.getDialect()}) ${retries}/${maxRetries}...`);
      console.error(`Erreur (${sequelize.getDialect()}):`, err.message);
      if (retries >= maxRetries) {
        console.error('Impossible de se connecter à la base après', maxRetries, 'tentatives');
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 Serveur backend démarré sur le port ${PORT} (${env.NODE_ENV})`);
  });
}

startServer();