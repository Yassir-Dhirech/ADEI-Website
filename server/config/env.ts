import dotenv from 'dotenv';
dotenv.config();

type DbDialect = 'mysql' | 'postgres';

interface DbConfig {
  readonly dialect: DbDialect;
  readonly host: string;
  readonly port: number;
  readonly name: string;
  readonly user: string;
  readonly password: string;
}

interface EnvConfig {
  readonly PORT: number;
  readonly NODE_ENV: string;
  readonly isProduction: boolean;
  readonly isDevelopment: boolean;
  readonly JWT_SECRET: string;
  readonly CORS_ORIGINS: readonly string[];
  readonly TRUST_PROXY: boolean;
  readonly DB: DbConfig;
  readonly configErrors: readonly string[];
}

const errors: string[] = [];

const PORT = parseInt(process.env.PORT || '', 10) || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isDevelopment = !isProduction;

const JWT_SECRET = process.env.JWT_SECRET || '';
if (!JWT_SECRET) {
  errors.push('JWT_SECRET est obligatoire.');
} else if (JWT_SECRET.length < 32) {
  errors.push(`JWT_SECRET est trop court (${JWT_SECRET.length} caractères). Il doit contenir au moins 32 caractères.`);
}

let dbUrlParsed: URL | null = null;
if (process.env.DATABASE_URL) {
  try {
    dbUrlParsed = new URL(process.env.DATABASE_URL);
  } catch {
    errors.push('DATABASE_URL est une URL invalide.');
  }
}

const rawDialect = (
  process.env.DB_DIALECT ||
  (dbUrlParsed ? (dbUrlParsed.protocol.startsWith('postgres') ? 'postgres' : 'mysql') : 'postgres')
).toLowerCase();

if (rawDialect !== 'mysql' && rawDialect !== 'postgres') {
  errors.push(`DB_DIALECT "${rawDialect}" n'est pas supporté. Utilisez "mysql" ou "postgres".`);
}
const DB_DIALECT: DbDialect = rawDialect === 'postgres' ? 'postgres' : 'mysql';

const defaultPort = DB_DIALECT === 'postgres' ? 5432 : 3306;
const defaultHost = isProduction ? (dbUrlParsed ? dbUrlParsed.hostname : '') : DB_DIALECT;
const DB_HOST = process.env.DB_HOST || (dbUrlParsed ? dbUrlParsed.hostname : defaultHost);
const DB_PORT = parseInt(process.env.DB_PORT || (dbUrlParsed && dbUrlParsed.port ? dbUrlParsed.port : ''), 10) || defaultPort;
const DB_NAME = process.env.DB_NAME || (dbUrlParsed ? dbUrlParsed.pathname.replace(/^\//, '') : (DB_DIALECT === 'postgres' ? 'adei_pg' : 'adei_db'));
const DB_USER = process.env.DB_USER || (dbUrlParsed ? decodeURIComponent(dbUrlParsed.username) : (DB_DIALECT === 'postgres' ? 'adei_pg_user' : 'adei_user'));
const DB_PASSWORD = process.env.DB_PASSWORD || (dbUrlParsed ? decodeURIComponent(dbUrlParsed.password) : '');

if (!process.env.DATABASE_URL) {
  if (!DB_HOST) errors.push('DB_HOST est obligatoire.');
  if (!DB_NAME) errors.push('DB_NAME est obligatoire.');
  if (!DB_USER) errors.push('DB_USER est obligatoire.');
  if (isProduction && !DB_PASSWORD) {
    errors.push('DB_PASSWORD est obligatoire en production.');
  }
}

let CORS_ORIGINS: string[] = [];
if (process.env.CORS_ORIGINS) {
  CORS_ORIGINS = process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
}

if (isProduction && CORS_ORIGINS.length === 0) {
  errors.push('CORS_ORIGINS doit être défini en production (ex: CORS_ORIGINS=https://adei-ensaf.ma).');
} else if (isDevelopment && CORS_ORIGINS.length === 0) {
  CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];
}

const TRUST_PROXY = process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1';

if (errors.length > 0) {
  console.error('\n❌ ERREURS DE CONFIGURATION DE DÉMARRAGE:');
  errors.forEach((err) => console.error(`  - ${err}`));
  console.error('\nVérifiez votre fichier .env et relancez le serveur.\n');
  if (!process.env.VERCEL) {
    process.exit(1);
  }
}

const env: EnvConfig = Object.freeze({
  PORT,
  NODE_ENV,
  isProduction,
  isDevelopment,
  JWT_SECRET,
  CORS_ORIGINS: Object.freeze(CORS_ORIGINS),
  TRUST_PROXY,
  configErrors: Object.freeze([...errors]),
  DB: Object.freeze({
    dialect: DB_DIALECT,
    host: DB_HOST,
    port: DB_PORT,
    name: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD
  })
});

export = env;
