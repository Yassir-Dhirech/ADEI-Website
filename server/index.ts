import app from './app';
import env from './config/env';
import sequelize from './config/database';

const PORT = env.PORT || 5001;

async function startServer(): Promise<void> {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await sequelize.authenticate();
      console.log(`Base de données (${sequelize.getDialect()}) connectée avec succès`);
      break;
    } catch (err) {
      retries++;
      const message = err instanceof Error ? err.message : String(err);
      console.log(`Tentative de connexion (${sequelize.getDialect()}) ${retries}/${maxRetries}...`);
      console.error(`Erreur (${sequelize.getDialect()}):`, message);
      if (retries >= maxRetries) {
        console.error('Impossible de se connecter à la base après', maxRetries, 'tentatives');
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 Serveur backend TypeScript démarré sur le port ${PORT} (${env.NODE_ENV})`);
  });
}

startServer();
