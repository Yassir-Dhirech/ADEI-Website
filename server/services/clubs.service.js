const { Club } = require('../models');
const { safeDeleteUpload } = require('../config/upload');
const { pickFields } = require('../utils/sanitize');

function parseJsonList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return typeof value === 'string'
      ? value.split(',').map((item) => item.trim()).filter(Boolean)
      : [];
  }
}

function formatClub(club) {
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

function normalizeClubInput(body, file) {
  const data = pickFields(body, 'clubs');
  if (file) data.image = `/uploads/${file.filename}`;
  if (data.members) data.members = parseInt(data.members, 10) || 0;
  if (data.activities && typeof data.activities !== 'string') data.activities = JSON.stringify(data.activities);
  if (data.achievements && typeof data.achievements !== 'string') data.achievements = JSON.stringify(data.achievements);
  return data;
}

async function listClubs() {
  const clubs = await Club.findAll({ order: [['createdAt', 'DESC']] });
  return clubs.map(formatClub);
}

async function createClub(body, file) {
  return Club.create(normalizeClubInput(body, file));
}

async function updateClub(id, body, file) {
  const club = await Club.findByPk(id);
  if (!club) return null;
  if (file) safeDeleteUpload(club.image);
  await club.update(normalizeClubInput(body, file));
  return club;
}

async function deleteClub(id) {
  const club = await Club.findByPk(id);
  if (!club) return false;
  safeDeleteUpload(club.image);
  await club.destroy();
  return true;
}

module.exports = { listClubs, createClub, updateClub, deleteClub };