import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../app';
import env from '../config/env';
import { resetTestDatabase, sequelize } from './setup';
import { User, Event, EventRegistration, AuditLog } from '../models';

describe('Journal d\'Audit & Gouvernance (Audit Logging System)', () => {
  let adminUser: any;
  let normalUser: any;
  let adminToken: string;
  let userToken: string;
  let testEvent: any;

  beforeAll(async () => {
    const users = await resetTestDatabase();
    adminUser = users.adminUser;
    normalUser = users.normalUser;

    adminToken = jwt.sign(
      { id: adminUser.id, username: adminUser.username, email: adminUser.email, role: 'admin' },
      env.JWT_SECRET || 'test_secret_for_jwt_signing_min_32_characters'
    );

    userToken = jwt.sign(
      { id: normalUser.id, username: normalUser.username, email: normalUser.email, role: 'user' },
      env.JWT_SECRET || 'test_secret_for_jwt_signing_min_32_characters'
    );

    testEvent = await Event.create({
      title: 'Conférence IA & Cybersécurité',
      description: 'Conférence académique',
      date: '2026-12-10',
      time: '14:00',
      location: 'Amphi A',
      status: 'approved'
    });

    // Inscrire 2 invités pour le test de comptage d'export
    await EventRegistration.create({
      eventId: testEvent.id,
      guestName: 'Participant 1',
      guestEmail: 'p1@test.ma'
    });
    await EventRegistration.create({
      eventId: testEvent.id,
      guestName: 'Participant 2',
      guestEmail: 'p2@test.ma'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('1. Un utilisateur non-admin reçoit 403 Forbidden sur GET /api/audit/logs', async () => {
    const res = await request(app)
      .get('/api/audit/logs')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('2. Un admin peut consulter GET /api/audit/logs et l action de consultation est elle-même auditée', async () => {
    const res = await request(app)
      .get('/api/audit/logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.logs)).toBe(true);

    // Vérifier qu'un log AUDIT_LOGS_VIEW a été consigné
    const viewLog = await AuditLog.findOne({
      where: { action: 'AUDIT_LOGS_VIEW' }
    });
    expect(viewLog).not.toBeNull();
    expect(viewLog?.actorEmail).toBe(adminUser.email);
  });

  test('3. L approbation d un utilisateur écrit exactement une entrée avec acteur et cible', async () => {
    const candidate = await User.create({
      username: 'candidat_etudiant',
      email: 'candidat@test.ma',
      password: await bcrypt.hash('Test1234!', 10),
      role: 'user',
      status: 'pending'
    });

    const res = await request(app)
      .patch(`/api/users/${candidate.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active', role: 'user' });

    expect(res.statusCode).toBe(200);

    const logs = await AuditLog.findAll({
      where: {
        action: 'USER_APPROVE',
        resourceId: String(candidate.id)
      }
    });

    expect(logs.length).toBe(1);
    const log = logs[0];
    expect(log.actorEmail).toBe(adminUser.email);
    expect(log.actorRole).toBe('admin');
    expect(log.details?.targetUsername).toBe('candidat_etudiant');
    expect(log.details?.targetEmail).toBe('candidat@test.ma');
  });

  test('4. La consultation du roster écrit une entrée ROSTER_EXPORT avec le compte exact', async () => {
    const res = await request(app)
      .get(`/api/events/${testEvent.id}/registrations`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);

    const log = await AuditLog.findOne({
      where: {
        action: 'ROSTER_EXPORT',
        resourceId: String(testEvent.id)
      },
      order: [['createdAt', 'DESC']]
    });

    expect(log).not.toBeNull();
    expect(log?.actorEmail).toBe(adminUser.email);
    expect(log?.details?.exportedCount).toBe(2);
    expect(log?.details?.eventTitle).toBe('Conférence IA & Cybersécurité');
  });

  test('5. Aucun endpoint client n existe pour forger des audits (POST /api/audit/log-export -> 404)', async () => {
    const res = await request(app)
      .post('/api/audit/log-export')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ eventId: testEvent.id, count: 999 });

    expect(res.statusCode).toBe(404);
  });

  test('6. Le paramètre limit est strictement plafonné à 100', async () => {
    const res = await request(app)
      .get('/api/audit/logs?limit=500')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.logs.length).toBeLessThanOrEqual(100);
  });
});
