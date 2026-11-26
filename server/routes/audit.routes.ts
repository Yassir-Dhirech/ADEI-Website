import { Router } from 'express';
import * as auditController from '../controllers/audit.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// Journal d'audit complet réservé aux administrateurs ADEI
router.get('/logs', authMiddleware, adminMiddleware, auditController.getAuditLogs);

export default router;
