import { Op } from 'sequelize';
import { Club, ClubMember, User } from '../models';
import { pickFields } from '../utils/sanitize';
import { storageService } from './storage.service';
import { getCurrentAcademicYear } from './permissions.service';

export const NOT_ASSIGNED_PRESIDENT = 'Non assigné pour le moment';

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

export interface PresidentMembershipInfo {
  userId: number;
  user?: {
    id: number;
    username: string;
    email: string;
  } | null;
}

export function formatClub(club: Club, presidentMembership?: PresidentMembershipInfo | null) {
  return {
    id: club.id,
    club: club.club,
    president: club.president || NOT_ASSIGNED_PRESIDENT,
    annees_etude: club.annees_etude || 'Non spécifié',
    tel: club.tel || '—',
    email: club.email || 'contact@adei-ensaf.ma',
    website: club.website || '',
    image: club.image || '',
    description: club.description || '',
    activities: parseJsonList(club.activities),
    achievements: parseJsonList(club.achievements),
    members: club.members || 0,
    facebook: club.facebook || '',
    instagram: club.instagram || '',
    linkedin: club.linkedin || '',
    pendingUpdates: club.pendingUpdates || null,
    pendingUpdatesSubmittedBy: club.pendingUpdatesSubmittedBy || null,
    pendingUpdatesAt: club.pendingUpdatesAt || null,
    presidentId: presidentMembership?.userId || null,
    presidentUser: presidentMembership?.user
      ? {
          id: presidentMembership.user.id,
          username: presidentMembership.user.username,
          email: presidentMembership.user.email
        }
      : null,
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

/**
 * Gère l'assignation ou la désassignation du président d'un club
 */
export async function handlePresidentAssignment(club: Club, presidentIdRaw: unknown) {
  const currentYear = getCurrentAcademicYear();

  // Cas : Désassignation (Non assigné pour le moment)
  if (
    presidentIdRaw === 'none' ||
    presidentIdRaw === '' ||
    presidentIdRaw === null ||
    presidentIdRaw === 0 ||
    presidentIdRaw === '0'
  ) {
    try {
      const oldPresidents = await ClubMember.findAll({
        where: {
          clubId: club.id,
          role: 'president',
          status: 'active'
        }
      });

      if (oldPresidents.length > 0) {
        await ClubMember.update(
          { status: 'left' },
          {
            where: {
              clubId: club.id,
              role: 'president',
              status: 'active'
            }
          }
        );

        for (const m of oldPresidents) {
          const otherCount = await ClubMember.count({
            where: {
              userId: m.userId,
              role: 'president',
              status: 'active'
            }
          });
          if (otherCount === 0) {
            await User.update({ is_president: false }, { where: { id: m.userId } });
          }
        }
      }
    } catch (err) {
      console.warn('[handlePresidentAssignment:unassign] ClubMember error:', err);
    }

    await club.update({ president: NOT_ASSIGNED_PRESIDENT });
    return;
  }

  // Cas : Assignation d'un utilisateur
  const parsedId = Number(presidentIdRaw);
  if (!Number.isNaN(parsedId) && parsedId > 0) {
    const user = await User.findByPk(parsedId);
    if (user) {
      try {
        // 1. Désactiver les anciens présidents de ce club
        const previousActive = await ClubMember.findAll({
          where: {
            clubId: club.id,
            role: 'president',
            status: 'active',
            userId: { [Op.ne]: user.id }
          }
        });

        if (previousActive.length > 0) {
          await ClubMember.update(
            { status: 'left' },
            {
              where: {
                clubId: club.id,
                role: 'president',
                status: 'active',
                userId: { [Op.ne]: user.id }
              }
            }
          );

          for (const prev of previousActive) {
            const otherCount = await ClubMember.count({
              where: {
                userId: prev.userId,
                role: 'president',
                status: 'active'
              }
            });
            if (otherCount === 0) {
              await User.update({ is_president: false }, { where: { id: prev.userId } });
            }
          }
        }

        // 2. Créer ou activer l'adhésion président
        const [membership] = await ClubMember.findOrCreate({
          where: {
            userId: user.id,
            clubId: club.id,
            academicYear: currentYear
          },
          defaults: {
            userId: user.id,
            clubId: club.id,
            role: 'president',
            status: 'active',
            academicYear: currentYear
          }
        });

        if (membership.role !== 'president' || membership.status !== 'active') {
          await membership.update({ role: 'president', status: 'active' });
        }

        // 3. Activer le drapeau is_president sur le compte utilisateur
        if (!user.is_president) {
          await user.update({ is_president: true });
        }
      } catch (err) {
        console.warn('[handlePresidentAssignment:assign] ClubMember error:', err);
      }

      // 4. Mettre à jour les informations du club avec le nom et coordonnées du président
      await club.update({
        president: user.username,
        email: user.email,
        tel: user.phone || (club.tel && club.tel !== '—' ? club.tel : '—')
      });
    }
  }
}

export async function listClubs() {
  const clubs = await Club.findAll({ order: [['createdAt', 'DESC']] });
  const currentYear = getCurrentAcademicYear();
  const currentYears = [currentYear, currentYear.replace('/', '-')];

  const memberByClubId = new Map<number, PresidentMembershipInfo>();
  try {
    const memberships = await ClubMember.findAll({
      where: {
        role: 'president',
        status: 'active',
        academicYear: { [Op.in]: currentYears }
      },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'] }]
    });

    memberships.forEach((m) => {
      memberByClubId.set(m.clubId, m as unknown as PresidentMembershipInfo);
    });
  } catch (err) {
    console.warn('[listClubs] ClubMember query warning:', err);
  }

  return clubs.map((c) => formatClub(c, memberByClubId.get(c.id)));
}

export async function createClub(body: Record<string, unknown>, file?: Express.Multer.File): Promise<Club> {
  const input = await normalizeClubInput(body, file);

  // Valeurs par défaut pour respecter les contraintes de base
  if (!input.club || String(input.club).trim() === '') {
    input.club = 'Nouveau Club';
  }
  if (!input.president || String(input.president).trim() === '') {
    input.president = NOT_ASSIGNED_PRESIDENT;
  }
  if (!input.annees_etude || String(input.annees_etude).trim() === '') {
    input.annees_etude = '2026/2027';
  }
  if (!input.tel || String(input.tel).trim() === '') {
    input.tel = '—';
  }
  if (!input.email || String(input.email).trim() === '') {
    input.email = 'contact@adei-ensaf.ma';
  }

  const presidentIdRaw = body.presidentId ?? (input as Record<string, unknown>).presidentId;
  delete (input as Record<string, unknown>).presidentId;

  const club = await Club.create(input);

  if (presidentIdRaw !== undefined) {
    await handlePresidentAssignment(club, presidentIdRaw);
  }

  return club;
}

export async function updateClub(
  id: string | number,
  body: Record<string, unknown>,
  file?: Express.Multer.File
): Promise<Club | null> {
  const club = await Club.findByPk(id);
  if (!club) return null;

  const input = await normalizeClubInput(body, file, club);
  const presidentIdRaw = body.presidentId ?? (input as Record<string, unknown>).presidentId;
  delete (input as Record<string, unknown>).presidentId;

  await club.update(input);

  if (presidentIdRaw !== undefined) {
    await handlePresidentAssignment(club, presidentIdRaw);
  }

  return club;
}

export async function deleteClub(id: string | number): Promise<boolean> {
  const club = await Club.findByPk(id);
  if (!club) return false;
  if (club.image) await storageService.deleteFile(club.image);
  await ClubMember.destroy({ where: { clubId: club.id } });
  await club.destroy();
  return true;
}

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
