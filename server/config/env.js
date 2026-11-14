require('dotenv').config();

const errors = [];

// 1. Port & Environment
const PORT = parseInt(process.env.PORT, 10) || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isDevelopment = !isProduction;

// 2. JWT Secret Validation (minimum 32 characters)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  errors.push('JWT_SECRET est obligatoire.');
} else if (JWT_SECRET.length < 32) {
  errors.push(`JWT_SECRET est trop court (${JWT_SECRET.length} caractères). Il doit contenir au moins 32 caractères.`);
}

// 3. Database Variables
const DB_HOST = process.env.DB_HOST || (isProduction ? null : 'mysql');
const DB_PORT = parseInt(process.env.DB_PORT, 10) || 3306;
const DB_NAME = process.env.DB_NAME || 'adei_db';
const DB_USER = process.env.DB_USER || 'adei_user';
const DB_PASSWORD = process.env.DB_PASSWORD || '';

if (!DB_HOST) errors.push('DB_HOST est obligatoire.');
if (!DB_NAME) errors.push('DB_NAME est obligatoire.');
if (!DB_USER) errors.push('DB_USER est obligatoire.');

// In production, DB password must not be empty
if (isProduction && !DB_PASSWORD) {
  errors.push('DB_PASSWORD est obligatoire en production.');
}

// 4. CORS Origins Validation
let CORS_ORIGINS = [];
if (process.env.CORS_ORIGINS) {
  CORS_ORIGINS = process.env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
}

if (isProduction && CORS_ORIGINS.length === 0) {
  errors.push('CORS_ORIGINS doit être défini en production (ex: CORS_ORIGINS=https://adei-ensaf.ma).');
} else if (isDevelopment && CORS_ORIGINS.length === 0) {
  CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];
}

// 5. Proxy configuration
const TRUST_PROXY = process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1';

// If any critical environment errors were found, halt the server immediately
if (errors.length > 0) {
  console.error('\n❌ ERREURS DE CONFIGURATION DE DÉMARRAGE:');
  errors.forEach(err => console.error(`  - ${err}`));
  console.error('\nVérifiez votre fichier .env et relancez le serveur.\n');
  process.exit(1);
}

module.exports = Object.freeze({
  PORT,
  NODE_ENV,
  isProduction,
  isDevelopment,
  JWT_SECRET,
  CORS_ORIGINS,
  TRUST_PROXY,
  DB: Object.freeze({
    host: DB_HOST,
    port: DB_PORT,
    name: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD
  })
});