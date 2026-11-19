import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import env from './config/env';
import { UPLOAD_DIR } from './config/upload';
import { errorMiddleware, notFoundMiddleware } from './middleware/errorHandler';

import filieresRoutes from './routes/filieres.routes';
import adeiMembersRoutes from './routes/adeiMembers.routes';
import partnersRoutes from './routes/partners.routes';
import clubsRoutes from './routes/clubs.routes';
import feedbacksRoutes from './routes/feedbacks.routes';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import newsRoutes from './routes/news.routes';
import eventsRoutes from './routes/events.routes';
import adeiRolesRoutes from './routes/adeiRoles.routes';
import academicRoutes from './routes/academic.routes';

const app = express();

if (process.env.TRUST_PROXY) {
  const hops = parseInt(process.env.TRUST_PROXY, 10);
  app.set('trust proxy', isNaN(hops) ? (process.env.TRUST_PROXY === 'true') : hops);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (env.isDevelopment && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    const isAllowed = env.CORS_ORIGINS.some((allowedOrigin) => {
      if (allowedOrigin === origin) return true;
      if (allowedOrigin.includes('*')) {
        const regex = new RegExp('^' + allowedOrigin.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
        return regex.test(origin);
      }
      return false;
    });
    if (isAllowed) {
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

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API ADEI is running',
    timestamp: new Date().toISOString()
  });
});

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

app.get('/', (_req, res) => {
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
      partners: 'GET /api/partners',
      adeiRoles: 'GET /api/adei-roles',
      academic: 'GET /api/academic'
    }
  });
});

app.use(errorMiddleware);
app.use('*', notFoundMiddleware);

export = app;
