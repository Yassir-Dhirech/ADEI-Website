require('dotenv').config();
const { Sequelize, QueryTypes } = require('sequelize');

// 1. Forcer la cible sur PostgreSQL pour initialiser les modèles Sequelize
process.env.DB_DIALECT = 'postgres';
process.env.DB_HOST = process.env.POSTGRES_HOST || 'postgres';
process.env.DB_PORT = process.env.POSTGRES_PORT || '5432';
process.env.DB_NAME = process.env.POSTGRES_DB || 'adei_pg';
process.env.DB_USER = process.env.POSTGRES_USER || 'adei_pg_user';
process.env.DB_PASSWORD = process.env.POSTGRES_PASSWORD || 'change_me_postgres_password';

const {
  sequelize: pgSequelize,
  User,
  Club,
  Filiere,
  Partner,
  ADEIMember,
  News,
  Event,
  Feedback
} = require('../models');

// 2. Connexion source vers MySQL
const mysqlSequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.MYSQL_HOST || 'mysql',
  port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
  database: process.env.MYSQL_DATABASE || 'adei_db',
  username: process.env.MYSQL_USER || 'adei_user',
  password: process.env.MYSQL_PASSWORD || 'adei_password',
  logging: false
});

// 3. Ordre topologique strict (tables parentes d'abord, tables enfants ensuite)
const MIGRATION_PLAN = [
  { model: Filiere, table: 'filieres', booleans: [] },
  { model: Club, table: 'clubs', booleans: [] },
  { model: User, table: 'users', booleans: ['is_president', 'is_representant', 'is_membre_adei', 'is_bureau_adei'] },
  { model: ADEIMember, table: 'adei_members', booleans: [] },
  { model: Partner, table: 'partners', booleans: [] },
  { model: News, table: 'news', booleans: [] },
  { model: Event, table: 'events', booleans: [] },
  { model: Feedback, table: 'feedbacks', booleans: ['read'] }
];

async function runMigration() {
  console.log('🚀 Début de la migration des données de MySQL vers PostgreSQL...\n');

  try {
    // Vérification de la connectivité sur les deux bases
    await mysqlSequelize.authenticate();
    console.log('✅ Connexion source (MySQL) établie avec succès.');

    await pgSequelize.authenticate();
    console.log('✅ Connexion cible (PostgreSQL) établie avec succès.');

    // Synchronisation du schéma dans PostgreSQL (création des tables si inexistantes)
    console.log('\n📦 Création et vérification du schéma PostgreSQL...');
    await pgSequelize.sync({ force: false });
    console.log('✅ Schéma PostgreSQL prêt.\n');

    console.log('🚚 Transfert des données table par table :');
    console.log('------------------------------------------------------------');

    for (const { model, table, booleans } of MIGRATION_PLAN) {
      // 1. Extraire les lignes depuis MySQL
      const rows = await mysqlSequelize.query(`SELECT * FROM \`${table}\``, {
        type: QueryTypes.SELECT
      });

      if (!rows || rows.length === 0) {
        console.log(`ℹ️  [${table}] 0 enregistrement trouvé dans MySQL. Ignoré.`);
        continue;
      }

      // 2. Transformer : convertir les 0/1 MySQL en vrais booléens pour PostgreSQL
      const cleanedRows = rows.map(row => {
        const cleaned = { ...row };
        for (const boolField of booleans) {
          if (cleaned[boolField] !== undefined && cleaned[boolField] !== null) {
            cleaned[boolField] = Boolean(cleaned[boolField]);
          }
        }
        return cleaned;
      });

      // 3. Charger dans PostgreSQL (ignoreDuplicates pour garantir l'idempotence)
      await model.bulkCreate(cleanedRows, {
        ignoreDuplicates: true
      });

      // 4. Synchroniser le compteur de séquence PostgreSQL (auto-increment)
      await pgSequelize.query(`
        SELECT setval(
          pg_get_serial_sequence('"${table}"', 'id'),
          COALESCE((SELECT MAX(id) FROM "${table}"), 1),
          (SELECT MAX(id) FROM "${table}") IS NOT NULL
        );
      `);

      const totalInPg = await model.count();
      console.log(`✅ [${table}] ${rows.length} lignes migrées (Total dans Postgres : ${totalInPg})`);
    }

    console.log('------------------------------------------------------------');
    console.log('\n🎉 Migration MySQL ➡️  PostgreSQL terminée avec succès sans perte !');
  } catch (error) {
    console.error('\n❌ Erreur pendant la migration :', error);
    process.exit(1);
  } finally {
    await mysqlSequelize.close();
    await pgSequelize.close();
  }
}

runMigration();