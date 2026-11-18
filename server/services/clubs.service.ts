import { Club } from '../models';
import { safeDeleteUpload } from '../config/upload';
import { pickFields } from '../utils/sanitize';

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

function normalizeClubInput(body: Record<string, unknown>, file?: Express.Multer.File): Record<string, unknown> {
  const data = pickFields(body, 'clubs');
  if (file) data.image = `/uploads/${file.filename}`;
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
  return Club.create(normalizeClubInput(body, file));
}

export async function updateClub(id: string | number, body: Record<string, unknown>, file?: Express.Multer.File): Promise<Club | null> {
  const club = await Club.findByPk(id);
  if (!club) return null;
  if (file) safeDeleteUpload(club.image);
  await club.update(normalizeClubInput(body, file));
  return club;
}

export async function deleteClub(id: string | number): Promise<boolean> {
  const club = await Club.findByPk(id);
  if (!club) return false;
  safeDeleteUpload(club.image);
  await club.destroy();
  return true;
}
