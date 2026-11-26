const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../app');
const env = require('../config/env');
const { resetTestDatabase, sequelize } = require('./setup');
const { User, Club, ClubMember, Event, EventRegistration } = require('../models');
const {
  getCurrentAcademicYear,
  canManageClub,
  canTransition
} = require('../services/permissions.service');

let adminUser;
let studentUser;
let club1;
let club2;
const currentYear = getCurrentAcademicYear();

beforeAll(async () => {
  const users = await resetTestDatabase();
  adminUser = users.adminUser;
  studentUser = users.normalUser;

  // Création de deux clubs pour les tests d'isolation des permissions
  club1 = await Club.create({
    club: 'Club Informatique (CIT)',
    president: 'Président CIT',
    annees_etude: '2025-2026',
    tel: '0600000001',
    email: 'cit@ensaf.ma'
  });

  club2 = await Club.create({
    club: 'Club Musique & Arts',
    president: 'Président Musique',
    annees_etude: '2025-2026',
    tel: '0600000002',
    email: 'musique@ensaf.ma'
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('1. Calcul de l\'année universitaire (getCurrentAcademicYear)', () => {
  test('Septembre 2025 donne l\'année 2025-2026', () => {
    const septDate = new Date(2025, 8, 15); // Mois 8 = Septembre
    expect(getCurrentAcademicYear(septDate)).toBe('2025-2026');
  });

  test('Janvier 2026 donne l\'année 2025-2026', () => {
    const janDate = new Date(2026, 0, 10); // Mois 0 = Janvier
    expect(getCurrentAcademicYear(janDate)).toBe('2025-2026');
  });

  test('Août 2026 donne encore l\'année 2025-2026 (fin d\'année)', () => {
    const augDate = new Date(2026, 7, 31); // Mois 7 = Août
    expect(getCurrentAcademicYear(augDate)).toBe('2025-2026');
  });

  test('Octobre 2026 bascule sur 2026-2027', () => {
    const octDate = new Date(2026, 9, 1); // Mois 9 = Octobre
    expect(getCurrentAcademicYear(octDate)).toBe('2026-2027');
  });
});

describe('2. Gestion des droits de club (canManageClub)', () => {
  let presidentUser;
  let otherClubPresident;
  let regularMemberUser;

  beforeAll(async () => {
    presidentUser = await User.create({
      username: 'president_cit',
      email: 'pres_cit@ensaf.ma',
      password: 'HashPassword123!',
      role: 'user'
    });

    otherClubPresident = await User.create({
      username: 'president_musique',
      email: 'pres_musique@ensaf.ma',
      password: 'HashPassword123!',
      role: 'user'
    });

    regularMemberUser = await User.create({
      username: 'membre_simple',
      email: 'membre@ensaf.ma',
      password: 'HashPassword123!',
      role: 'user'
    });

    // presidentUser est président ACTIF du club 1 pour l'année en cours
    await ClubMember.create({
      userId: presidentUser.id,
      clubId: club1.id,
      role: 'president',
      status: 'active',
      academicYear: currentYear
    });

    // otherClubPresident est président ACTIF du club 2 pour l'année en cours
    await ClubMember.create({
      userId: otherClubPresident.id,
      clubId: club2.id,
      role: 'president',
      status: 'active',
      academicYear: currentYear
    });

    // regularMemberUser est simple membre du club 1
    await ClubMember.create({
      userId: regularMemberUser.id,
      clubId: club1.id,
      role: 'member',
      status: 'active',
      academicYear: currentYear
    });
  });

  test('L\'administrateur ADEI a les droits de gestion sur TOUS les clubs', async () => {
    const canManageClub1 = await canManageClub(adminUser, club1.id);
    const canManageClub2 = await canManageClub(adminUser, club2.id);
    expect(canManageClub1).toBe(true);
    expect(canManageClub2).toBe(true);
  });

  test('Le président du Club 1 PEUT gérer le Club 1', async () => {
    const can = await canManageClub(presidentUser, club1.id);
    expect(can).toBe(true);
  });

  test('🚨 SÉCURITÉ : Le président du Club 1 NE PEUT PAS gérer le Club 2', async () => {
    const can = await canManageClub(presidentUser, club2.id);
    expect(can).toBe(false);
  });

  test('Un simple membre (role: member) NE PEUT PAS gérer le Club 1', async () => {
    const can = await canManageClub(regularMemberUser, club1.id);
    expect(can).toBe(false);
  });

  test('Un utilisateur sans adhésion NE PEUT PAS gérer le Club 1', async () => {
    const can = await canManageClub(studentUser, club1.id);
    expect(can).toBe(false);
  });

  test('Un mandat expiré (année précédente) ne confère plus aucun droit', async () => {
    const oldPresident = await User.create({
      username: 'ancien_president',
      email: 'old_pres@ensaf.ma',
      password: 'HashPassword123!',
      role: 'user'
    });

    await ClubMember.create({
      userId: oldPresident.id,
      clubId: club1.id,
      role: 'president',
      status: 'active',
      academicYear: '2023-2024' // Année passée
    });

    const can = await canManageClub(oldPresident, club1.id);
    expect(can).toBe(false);
  });

  test('Un président en statut "pending" ou "rejected" n\'a aucun droit de gestion', async () => {
    const pendingPresident = await User.create({
      username: 'pending_pres',
      email: 'pending_pres@ensaf.ma',
      password: 'HashPassword123!',
      role: 'user'
    });

    await ClubMember.create({
      userId: pendingPresident.id,
      clubId: club1.id,
      role: 'president',
      status: 'pending',
      academicYear: currentYear
    });

    const can = await canManageClub(pendingPresident, club1.id);
    expect(can).toBe(false);
  });
});

describe('3. Transitions d\'état des événements (canTransition)', () => {
  const admin = { id: 1, role: 'admin' };
  const clubPresident = { id: 2, role: 'user' };

  test('Un admin peut approuver (pending -> approved)', () => {
    expect(canTransition(admin, 'pending', 'approved', false)).toBe(true);
  });

  test('Un admin peut rejeter (pending -> rejected)', () => {
    expect(canTransition(admin, 'pending', 'rejected', false)).toBe(true);
  });

  test('🚨 SÉCURITÉ : Un non-admin NE PEUT JAMAIS passer un événement à "approved"', () => {
    expect(canTransition(clubPresident, 'draft', 'approved', true)).toBe(false);
    expect(canTransition(clubPresident, 'pending', 'approved', true)).toBe(false);
  });

  test('Un président peut soumettre son brouillon (draft -> pending)', () => {
    expect(canTransition(clubPresident, 'draft', 'pending', true)).toBe(true);
  });

  test('Un président peut resoumettre après correction d\'un rejet (rejected -> pending)', () => {
    expect(canTransition(clubPresident, 'rejected', 'pending', true)).toBe(true);
  });

  test('RÈGLE (b) : Modifier un événement déjà approuvé le renvoie à pending pour re-validation', () => {
    expect(canTransition(clubPresident, 'approved', 'pending', true)).toBe(true);
  });
});

describe('4. Visibilité publique des événements (Filtre status = approved)', () => {
  beforeAll(async () => {
    // 1 événement approuvé
    await Event.create({
      title: 'Forum Entreprises ENSAF 2026',
      description: 'Grand forum de recrutement',
      date: '2026-12-01',
      time: '09:00',
      location: 'Amphi A',
      status: 'approved'
    });

    // 1 événement en attente (pending) - ne doit PAS apparaître
    await Event.create({
      title: 'Tournoi E-Sport Inter-Clubs (En attente)',
      description: 'Tournoi proposé par un club',
      date: '2026-12-15',
      time: '14:00',
      location: 'Salle Informatique',
      status: 'pending'
    });

    // 1 brouillon (draft) - ne doit PAS apparaître
    await Event.create({
      title: 'Soirée Gala (Brouillon)',
      description: 'Brouillon interne',
      date: '2026-12-31',
      time: '20:00',
      location: 'Palais des Congrès',
      status: 'draft'
    });
  });

  test('GET /api/events ne renvoie QUE les événements au statut "approved"', async () => {
    const res = await request(app).get('/api/events');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    // Tous les événements retournés doivent avoir status === 'approved'
    const nonApproved = res.body.data.filter((e) => e.status !== 'approved');
    expect(nonApproved.length).toBe(0);

    // L'événement en attente ne doit pas être présent
    const pendingEvent = res.body.data.find((e) => e.title.includes('Tournoi E-Sport'));
    expect(pendingEvent).toBeUndefined();

    // L'événement approuvé doit être présent
    const approvedEvent = res.body.data.find((e) => e.title.includes('Forum Entreprises'));
    expect(approvedEvent).toBeDefined();
    expect(approvedEvent.status).toBe('approved');
  });
});

describe('5. Isolation des listes d inscrits (Rosters) et Déduplication des Invités', () => {
  let pres1User;
  let pres1Token;
  let pres2User;
  let pres2Token;
  let eventClub1;
  let eventClub2;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('PresPassword123!', 10);

    // Président Club 1
    pres1User = await User.create({
      username: 'president_cit',
      email: 'pres_cit@ensaf.ma',
      password: passwordHash,
      role: 'user',
      is_president: true,
      status: 'active'
    });

    await ClubMember.create({
      userId: pres1User.id,
      clubId: club1.id,
      role: 'president',
      status: 'active',
      academicYear: currentYear
    });

    pres1Token = jwt.sign(
      { id: pres1User.id, username: pres1User.username, email: pres1User.email, role: 'user' },
      env.JWT_SECRET || 'test_secret_for_jwt_signing_min_32_characters'
    );

    // Président Club 2
    pres2User = await User.create({
      username: 'president_musique',
      email: 'pres_musique@ensaf.ma',
      password: passwordHash,
      role: 'user',
      is_president: true,
      status: 'active'
    });

    await ClubMember.create({
      userId: pres2User.id,
      clubId: club2.id,
      role: 'president',
      status: 'active',
      academicYear: currentYear
    });

    pres2Token = jwt.sign(
      { id: pres2User.id, username: pres2User.username, email: pres2User.email, role: 'user' },
      env.JWT_SECRET || 'test_secret_for_jwt_signing_min_32_characters'
    );

    // Événement Club 1
    eventClub1 = await Event.create({
      title: 'Hackathon CIT 2026',
      description: 'Hackathon IA',
      date: '2026-11-30',
      time: '10:00',
      location: 'Laboratoire Informatique',
      clubId: club1.id,
      organizer: 'Club Informatique (CIT)',
      status: 'approved'
    });

    // Événement Club 2
    eventClub2 = await Event.create({
      title: 'Concert Acoustique Musique 2026',
      description: 'Concert des talents',
      date: '2026-12-05',
      time: '18:00',
      location: 'Amphi B',
      clubId: club2.id,
      organizer: 'Club Musique & Arts',
      status: 'approved'
    });
  });

  test('Le président du Club 1 peut consulter les inscrits de son propre événement (200)', async () => {
    const res = await request(app)
      .get(`/api/events/${eventClub1.id}/registrations`)
      .set('Authorization', `Bearer ${pres1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Le président du Club 1 NE PEUT PAS consulter les inscrits de l événement du Club 2 (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/events/${eventClub2.id}/registrations`)
      .set('Authorization', `Bearer ${pres1Token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('Inscription invité : la 1ère soumission réussit (200), la 2ème avec le même email est bloquée (400)', async () => {
    const guestData = {
      guestName: 'Karim Tazi',
      guestEmail: 'karim.tazi@gmail.com',
      guestPhone: '0612345678',
      guestFiliere: 'GI1'
    };

    // 1ère inscription
    const res1 = await request(app)
      .post(`/api/events/${eventClub1.id}/register-guest`)
      .send(guestData);

    expect(res1.statusCode).toBe(200);
    expect(res1.body.success).toBe(true);

    // 2ème inscription identique : doit être rejetée avec 400
    const res2 = await request(app)
      .post(`/api/events/${eventClub1.id}/register-guest`)
      .send(guestData);

    expect(res2.statusCode).toBe(400);
    expect(res2.body.success).toBe(false);
    expect(res2.body.error.message || res2.body.message).toContain('existe déjà');

    // Vérification en base : exactement 1 seule ligne créée
    const rowCount = await EventRegistration.count({
      where: {
        eventId: eventClub1.id,
        guestEmail: 'karim.tazi@gmail.com'
      }
    });
    expect(rowCount).toBe(1);
  });
});
