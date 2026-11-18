const request = require('supertest');
const app = require('../app');
const { resetTestDatabase, sequelize } = require('./setup');

let adminToken;
let userToken;

beforeAll(async () => {
  await resetTestDatabase();
});

afterAll(async () => {
  await sequelize.close();
});

describe('1. Health & 404', () => {
  test('GET /health renvoie 200 et status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET sur une route inexistante renvoie 404 NOT_FOUND', async () => {
    const res = await request(app).get('/api/cette-route-nexiste-pas');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});

describe('2. Routes GET publiques (Enveloppe uniforme { success, data })', () => {
  const publicEndpoints = [
    '/api/news',
    '/api/events',
    '/api/clubs',
    '/api/filieres',
    '/api/partners',
    '/api/adei-members',
    '/api/feedbacks/public',
    '/api/adei-roles',
    '/api/academic'
  ];

  test.each(publicEndpoints)('GET %s répond 200 avec { success: true, data }', async (endpoint) => {
    const res = await request(app).get(endpoint);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('3. Authentification (Login, 401, 403)', () => {
  test('POST /api/login avec mauvais identifiants renvoie 401', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'admin@test.ma', password: 'WrongPassword123' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/login admin valide renvoie 200 + token JWT', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'admin@test.ma', password: 'AdminTest123!' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    adminToken = res.body.data.token;
  });

  test('POST /api/login utilisateur standard valide renvoie 200 + token JWT', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'student@test.ma', password: 'UserTest123!' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
    userToken = res.body.data.token;
  });

  test('Route protégée sans token renvoie 401 Unauthorized', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(401);
  });

  test('Route admin avec token utilisateur standard renvoie 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
  });
});

describe('4. Cycle complet CRUD + Pagination sur /api/news', () => {
  let createdNewsId;

  test('POST /api/news (admin) crée une actualité (201)', async () => {
    const res = await request(app)
      .post('/api/news')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Actualité de Test Jest',
        content: 'Contenu créé par Supertest',
        date: '2026-11-17',
        category: 'academic'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    createdNewsId = res.body.data.id;
  });

  test('GET /api/news?page=1&limit=5 retourne l’actualité + meta de pagination', async () => {
    const res = await request(app).get('/api/news?page=1&limit=5');
    expect(res.statusCode).toBe(200);
    expect(res.body.meta).toEqual(expect.objectContaining({ page: 1, limit: 5, total: 1, totalPages: 1 }));
    const found = res.body.data.find((item) => item.id === createdNewsId);
    expect(found).toBeDefined();
    expect(found.title).toBe('Actualité de Test Jest');
  });

  test('PUT /api/news/:id (admin) met à jour l’actualité (200)', async () => {
    const res = await request(app)
      .put(`/api/news/${createdNewsId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Actualité Modifiée par Jest' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Actualité Modifiée par Jest');
  });

  test('DELETE /api/news/:id (admin) supprime l’actualité (200)', async () => {
    const res = await request(app)
      .delete(`/api/news/${createdNewsId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('5. Modération des Feedbacks (isPublished)', () => {
  let feedbackId;

  test('Un nouveau feedback anonyme (même avec isPublished: true injecté) reste masqué du public', async () => {
    const postRes = await request(app)
      .post('/api/feedbacks')
      .send({
        name: 'Étudiant Test',
        email: 'etudiant@ensaf.ma',
        type: 'avis',
        message: 'Super initiative ADEI !',
        isPublished: true
      });

    expect(postRes.statusCode).toBe(201);

    const publicRes = await request(app).get('/api/feedbacks/public');
    expect(publicRes.statusCode).toBe(200);
    expect(publicRes.body.data.length).toBe(0);

    const adminRes = await request(app)
      .get('/api/feedbacks')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminRes.statusCode).toBe(200);
    expect(adminRes.body.data.length).toBe(1);
    expect(adminRes.body.data[0].isPublished).toBe(false);
    feedbackId = adminRes.body.data[0].id;
  });

  test('Un admin peut publier le feedback via PUT /api/feedbacks/:id/publish', async () => {
    const pubRes = await request(app)
      .put(`/api/feedbacks/${feedbackId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isPublished: true });

    expect(pubRes.statusCode).toBe(200);
    expect(pubRes.body.data.isPublished).toBe(true);

    const publicRes = await request(app).get('/api/feedbacks/public');
    expect(publicRes.statusCode).toBe(200);
    expect(publicRes.body.data.length).toBe(1);
  });
});

describe('6. Sécurité & Validation (Cookie httpOnly, Magic Bytes, Zod)', () => {
  test('POST /api/login pose un cookie httpOnly et GET /api/users/me fonctionne uniquement via Cookie', async () => {
    const loginRes = await request(app)
      .post('/api/login')
      .send({ email: 'admin@test.ma', password: 'AdminTest123!' });

    expect(loginRes.statusCode).toBe(200);
    const setCookieHeader = loginRes.headers['set-cookie'];
    expect(setCookieHeader).toBeDefined();
    const authCookie = setCookieHeader.find((c) => c.startsWith('adei_token='));
    expect(authCookie).toBeDefined();
    expect(authCookie).toMatch(/HttpOnly/i);

    const meRes = await request(app)
      .get('/api/users/me')
      .set('Cookie', authCookie);

    expect(meRes.statusCode).toBe(200);
    expect(meRes.body.data.email).toBe('admin@test.ma');

    const logoutRes = await request(app).post('/api/logout');
    expect(logoutRes.statusCode).toBe(200);
    expect(logoutRes.headers['set-cookie'][0]).toMatch(/adei_token=;/);
  });

  test('Upload d’un faux .jpg (script HTML déguisé) est rejeté en 400 par Magic Bytes', async () => {
    const fakeJpg = Buffer.from('<script>alert("xss")</script>', 'utf-8');

    const res = await request(app)
      .post('/api/news')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', 'Test Faux JPG')
      .field('content', 'Tentative upload falsifié')
      .field('date', '2026-11-18')
      .attach('image', fakeJpg, { filename: 'evil.jpg', contentType: 'image/jpeg' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('UPLOAD_ERROR');
  });

  test('Zod rejette un payload invalide en 400 VALIDATION_ERROR avec error.details', async () => {
    const res = await request(app)
      .post('/api/news')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'A' }); // Trop court + content et date manquants

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
    expect(res.body.error.details.length).toBeGreaterThanOrEqual(2);
  });
});

describe('7. Rate Limiting sur /api/login', () => {
  test('Renvoie 429 Too Many Requests après dépassement du quota (20 requêtes)', async () => {
    let hitRateLimit = false;

    for (let i = 0; i < 22; i++) {
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'spam@test.ma', password: 'wrongpassword' });

      if (res.statusCode === 429) {
        hitRateLimit = true;
        break;
      }
    }

    expect(hitRateLimit).toBe(true);
  });
});
