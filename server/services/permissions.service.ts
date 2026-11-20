import { Op } from 'sequelize';
import { ClubMember } from '../models';
import { EventStatus } from '../models/Event';

export interface AuthUserPayload {
  id: number;
  role: 'admin' | 'user';
  email?: string;
  username?: string;
}

/**
 * Calcule l'année universitaire en cours au format 'YYYY-YYYY' (ex: '2025-2026').
 * Une année universitaire débute en septembre (mois 8 en JS 0-indexé) et se termine en août.
 * 
 * - Si le mois est >= 8 (Septembre à Décembre) : l'année a débuté cette année.
 * - Si le mois est < 8 (Janvier à Août) : l'année a débuté l'année précédente.
 */
export function getCurrentAcademicYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 = Janvier, 8 = Septembre

  if (month >= 8) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

/**
 * Vérifie si un utilisateur dispose des droits de gestion sur un club spécifique.
 * Règle de sécurité : Les droits ne sont jamais stockés dans le JWT car un mandat
 * ou une révocation peut survenir à tout moment. La vérification interroge toujours la base.
 *
 * @param user L'utilisateur authentifié
 * @param clubId L'identifiant du club ciblé
 * @returns true si l'utilisateur est admin ou président/responsable actif pour l'année en cours
 */
export async function canManageClub(
  user: AuthUserPayload | null | undefined,
  clubId: number | string
): Promise<boolean> {
  if (!user || !user.id) return false;

  // L'administrateur ADEI a les pleins pouvoirs sur tous les clubs
  if (user.role === 'admin') {
    return true;
  }

  const numericClubId = Number(clubId);
  if (isNaN(numericClubId)) return false;

  const currentYear = getCurrentAcademicYear();

  // Recherche d'un mandat actif en tant que président ou responsable de club pour l'année en cours
  const membership = await ClubMember.findOne({
    where: {
      userId: user.id,
      clubId: numericClubId,
      academicYear: currentYear,
      status: 'active',
      role: {
        [Op.in]: ['president', 'manager']
      }
    }
  });

  return membership !== null;
}

/**
 * Règles de transition d'état pour les événements (State Machine).
 * Détermine si le passage de currentStatus vers nextStatus est autorisé pour l'utilisateur.
 *
 * Règle de gouvernance choisie :
 * Si un président modifie un événement déjà approuvé, celui-ci repasse automatiquement à 'pending'
 * afin d'être re-validé par le bureau de l'ADEI avant réaffichage public.
 */
export function canTransition(
  user: AuthUserPayload,
  currentStatus: EventStatus,
  nextStatus: EventStatus,
  isManagerOrSubmitter: boolean
): boolean {
  // L'admin peut approuver, rejeter ou restaurer n'importe quel événement
  if (user.role === 'admin') {
    return true;
  }

  // Un utilisateur non-admin ne peut JAMAIS forcer l'état 'approved' ou 'rejected'
  if (nextStatus === 'approved' || nextStatus === 'rejected') {
    return false;
  }

  if (isManagerOrSubmitter) {
    // 1. Passage de draft vers pending (soumission au bureau ADEI)
    if (currentStatus === 'draft' && nextStatus === 'pending') {
      return true;
    }
    // 2. Resoumission après rejet (correction par le club)
    if (currentStatus === 'rejected' && nextStatus === 'pending') {
      return true;
    }
    // 3. Règle (b) : modification d'un événement approuvé -> re-validation obligatoire
    if (currentStatus === 'approved' && nextStatus === 'pending') {
      return true;
    }
    // 4. Maintien en brouillon
    if (currentStatus === 'draft' && nextStatus === 'draft') {
      return true;
    }
    // 5. Maintien en pending
    if (currentStatus === 'pending' && nextStatus === 'pending') {
      return true;
    }
  }

  return false;
}
