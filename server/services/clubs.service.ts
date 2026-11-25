import { Club } from '../models';
import { pickFields } from '../utils/sanitize';
import { storageService } from './storage.service';

function parseJsonList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return typeof value === 'string'
      ? value.split(',').map((item) => item.trim()).filter(Boolean)
      : [];
  }
}

function formatClub(club: Club) {
  return {
    id: club.id,
    club: club.club,
    president: club.president,
    annees_etude: club.annees_etude,
    tel: club.tel,
    email: club.email,
    website: club.website || '',
    image: club.image || '',
    description: club.description || '',
    activities: parseJsonList(club.activities),
    achievements: parseJsonList(club.achievements),
    members: club.members || 0,
    facebook: club.facebook || '',
    instagram: club.instagram || '',
    linkedin: club.linkedin || '',
    createdAt: club.createdAt,
    updatedAt: club.updatedAt,
    socialMedia: {
      facebook: club.facebook || '',
      instagram: club.instagram || '',
      linkedin: club.linkedin || ''
    }
  };
}

async function normalizeClubInput(
  body: Record<string, unknown>,
  file?: Express.Multer.File,
  existing?: Club | null
): Promise<Record<string, unknown>> {
  const data = pickFields(body, 'clubs');
  if (file) {
    if (existing?.image) await storageService.deleteFile(existing.image);
    const res = await storageService.saveFile(file, 'clubs');
    data.image = res.url;
  }
  if (data.members !== undefined) data.members = parseInt(String(data.members), 10) || 0;
  if (data.activities !== undefined) data.activities = parseJsonList(data.activities);
  if (data.achievements !== undefined) data.achievements = parseJsonList(data.achievements);
  return data;
}

export async function listClubs() {
  const clubs = await Club.findAll({ order: [['createdAt', 'DESC']] });
  return clubs.map(formatClub);
}

export async function createClub(body: Record<string, unknown>, file?: Express.Multer.File): Promise<Club> {
  const input = await normalizeClubInput(body, file);
  return Club.create(input);
}

export async function updateClub(id: string | number, body: Record<string, unknown>, file?: Express.Multer.File): Promise<Club | null> {
  const club = await Club.findByPk(id);
  if (!club) return null;
  const input = await normalizeClubInput(body, file, club);
  await club.update(input);
  return club;
}

export async function deleteClub(id: string | number): Promise<boolean> {
  const club = await Club.findByPk(id);
  if (!club) return false;
  if (club.image) await storageService.deleteFile(club.image);
  await club.destroy();
  return true;
}

import { Op } from 'sequelize';
import { ClubMember, User } from '../models';
import { getCurrentAcademicYear } from './permissions.service';

/**
 * Retrouve le club associé à un utilisateur président ou gestionnaire
 */
export async function findClubForUser(userId: number): Promise<Club | null> {
  const currentYear = getCurrentAcademicYear();

  // 1. Recherche par adhésion active dans club_members
  const membership = await ClubMember.findOne({
    where: {
      userId,
      role: { [Op.in]: ['president', 'manager'] },
      status: 'active'
    }
  });

  if (membership) {
    return Club.findByPk(membership.clubId);
  }

  // 2. Recherche par profil utilisateur (is_president ou mention du club dans classe)
  const user = await User.findByPk(userId);
  if (!user || (!user.is_president && user.requested_role !== 'president')) {
    return null;
  }

  const allClubs = await Club.findAll();
  for (const c of allClubs) {
    if (user.classe && user.classe.toLowerCase().includes(c.club.toLowerCase())) {
      // Auto-liaison dans club_members pour les prochaines requêtes
      await ClubMember.findOrCreate({
        where: { userId: user.id, clubId: c.id, academicYear: currentYear },
        defaults: { role: 'president', status: 'active', academicYear: currentYear, userId: user.id, clubId: c.id }
      });
      return c;
    }
  }

  return allClubs[0] || null;
}

/**
 * Enregistre les modifications proposées par le président (statut en attente)
 */
export async function proposeClubUpdate(
  clubId: string | number,
  userId: number,
  body: Record<string, unknown>,
  file?: Express.Multer.File
): Promise<{ ok: boolean; status?: number; message?: string; club?: Club }> {
  const club = await Club.findByPk(clubId);
  if (!club) return { ok: false, status: 404, message: 'Club non trouvé' };

  const input = await normalizeClubInput(body, file, club);
  // On ne modifie pas les champs publics immédiatement, on les stocke dans pendingUpdates
  await club.update({
    pendingUpdates: input,
    pendingUpdatesSubmittedBy: userId,
    pendingUpdatesAt: new Date()
  });

  return { ok: true, club };
}

/**
 * Validation par l'Admin ADEI : applique les modifications en attente
 */
export async function approveClubUpdate(
  clubId: string | number
): Promise<{ ok: boolean; status?: number; message?: string; club?: Club; presidentUser?: User | null }> {
  const club = await Club.findByPk(clubId);
  if (!club) return { ok: false, status: 404, message: 'Club non trouvé' };

  if (!club.pendingUpdates) {
    return { ok: false, status: 400, message: 'Aucune modification en attente pour ce club' };
  }

  const updates = club.pendingUpdates;
  const submitterId = club.pendingUpdatesSubmittedBy;

  await club.update({
    ...updates,
    pendingUpdates: null,
    pendingUpdatesSubmittedBy: null,
    pendingUpdatesAt: null
  });

  const presidentUser = submitterId ? await User.findByPk(submitterId) : null;
  return { ok: true, club, presidentUser };
}

/**
 * Rejet par l'Admin ADEI : annule les modifications en attente
 */
export async function rejectClubUpdate(
  clubId: string | number
): Promise<{ ok: boolean; status?: number; message?: string; club?: Club; presidentUser?: User | null }> {
  const club = await Club.findByPk(clubId);
  if (!club) return { ok: false, status: 404, message: 'Club non trouvé' };

  const submitterId = club.pendingUpdatesSubmittedBy;

  await club.update({
    pendingUpdates: null,
    pendingUpdatesSubmittedBy: null,
    pendingUpdatesAt: null
  });

  const presidentUser = submitterId ? await User.findByPk(submitterId) : null;
  return { ok: true, club, presidentUser };
}