import { Router } from 'express';
import * as eventsController from '../controllers/events.controller';
import { upload, validateUploadedFiles } from '../config/upload';
import { authMiddleware, adminMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { asyncWrapper } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { eventCreateSchema, eventUpdateSchema, eventGuestRegisterSchema } from '../validators/schemas';

const router = Router();

const eventUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 }
]);

// Route publique (événements validés uniquement, avec reconnaissance optionnelle de l'utilisateur connecté)
router.get('/', optionalAuthMiddleware, asyncWrapper(eventsController.getAll));

// Inscription étudiante (1 clic connecté ou formulaire invité public) & Consultation des inscrits (Admin / Organisateur)
router.post('/:id/register', authMiddleware, asyncWrapper(eventsController.toggleRegistration));
router.post('/:id/register-guest', validate(eventGuestRegisterSchema), asyncWrapper(eventsController.registerGuest));
router.get('/:id/registrations', authMiddleware, asyncWrapper(eventsController.getRegistrations));

// Espace Président : consulter ses propres événements soumis
router.get('/my-events', authMiddleware, asyncWrapper(eventsController.getMyEvents));

// Modération ADEI Admin : liste d'attente et décision
router.get('/moderation', authMiddleware, adminMiddleware, asyncWrapper(eventsController.getModerationEvents));
router.patch('/:id/status', authMiddleware, adminMiddleware, asyncWrapper(eventsController.updateStatus));

// Création et mise à jour (Présidents avec modération ou Admin avec publication directe)
router.post('/', authMiddleware, eventUpload, validateUploadedFiles, validate(eventCreateSchema), asyncWrapper(eventsController.create));
router.put('/:id', authMiddleware, eventUpload, validateUploadedFiles, validate(eventUpdateSchema), asyncWrapper(eventsController.update));

// Suppression et ordre (Admin uniquement)
router.delete('/:id', authMiddleware, adminMiddleware, asyncWrapper(eventsController.remove));
router.patch('/:id/reorder', authMiddleware, adminMiddleware, asyncWrapper(eventsController.reorder));

export default router;