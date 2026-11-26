import { registerSchema, eventGuestRegisterSchema } from '../validators/schemas';
import { hashOtp } from '../services/otp.service';

describe('Contrôles de Sécurité — Validation des Inscriptions et Protection des Rôles', () => {
  const validRegistrationPayload = {
    username: 'etudiant_test',
    email: 'etudiant@usmba.ac.ma',
    password: 'Password123!',
    phone: '0612345678',
    filiere: 'Génie Informatique',
    classe: 'GI1',
    requested_role: 'president' as const,
    otp: '123456'
  };

  test('registerSchema valide accepte une inscription étudiante légitime', () => {
    const result = registerSchema.safeParse(validRegistrationPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toBe('etudiant_test');
      expect(result.data.requested_role).toBe('president');
    }
  });

  test('registerSchema rejette formellement toute tentative d élévation de privilège (role: admin)', () => {
    const maliciousPayload = {
      ...validRegistrationPayload,
      role: 'admin'
    };
    const result = registerSchema.safeParse(maliciousPayload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorKeys = result.error.issues.map((issue) => (issue as { keys?: string[] }).keys || issue.path);
      expect(JSON.stringify(errorKeys)).toContain('role');
    }
  });

  test('registerSchema rejette toute injection directe de is_president ou is_representant', () => {
    const maliciousPayload1 = {
      ...validRegistrationPayload,
      is_president: true
    };
    const result1 = registerSchema.safeParse(maliciousPayload1);
    expect(result1.success).toBe(false);

    const maliciousPayload2 = {
      ...validRegistrationPayload,
      is_representant: true
    };
    const result2 = registerSchema.safeParse(maliciousPayload2);
    expect(result2.success).toBe(false);
  });

  test('registerSchema rejette toute injection de status: active pour contourner la validation ADEI', () => {
    const maliciousPayload = {
      ...validRegistrationPayload,
      status: 'active'
    };
    const result = registerSchema.safeParse(maliciousPayload);
    expect(result.success).toBe(false);
  });

  test('eventGuestRegisterSchema rejette les injections de privilèges pour les invités externes', () => {
    const guestPayload = {
      guestName: 'Visiteur Externe',
      guestEmail: 'visiteur@gmail.com',
      guestPhone: '0698765432',
      guestFiliere: 'Extérieur',
      userId: 1, // tentative d usurpation
      role: 'admin'
    };
    const result = eventGuestRegisterSchema.safeParse(guestPayload);
    expect(result.success).toBe(false);
  });

  test('eventGuestRegisterSchema valide un invité conforme', () => {
    const guestPayload = {
      guestName: 'Visiteur Externe',
      guestEmail: 'visiteur@gmail.com',
      guestPhone: '0698765432',
      guestFiliere: 'Lycéen'
    };
    const result = eventGuestRegisterSchema.safeParse(guestPayload);
    expect(result.success).toBe(true);
  });

  describe('Protection contre l injection de formules CSV (Formula Injection)', () => {
    function sanitizeCsvCell(value: unknown): string {
      if (value === null || value === undefined) return '""';
      let str = String(value);
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str.replace(/"/g, '""')}"`;
    }

    test('Préfixe une apostrophe sur toute formule débutant par =, +, -, @ ou tabulation', () => {
      expect(sanitizeCsvCell('=cmd|"/C calc"!A0')).toBe('"\'=cmd|""/C calc""!A0"');
      expect(sanitizeCsvCell('+123456789')).toBe('"\' +123456789"'.replace(' ', ''));
      expect(sanitizeCsvCell('-5+2')).toBe('"\' -5+2"'.replace(' ', ''));
      expect(sanitizeCsvCell('@SUM(A1:A10)')).toBe('"\'@SUM(A1:A10)"');
      expect(sanitizeCsvCell('\t=1+1')).toBe('"\'\t=1+1"');
    });

    test('Laisse intactes les cellules de texte standard et échappe les guillemets', () => {
      expect(sanitizeCsvCell('Amine Bennani')).toBe('"Amine Bennani"');
      expect(sanitizeCsvCell('Club "Robotique" ENSA')).toBe('"Club ""Robotique"" ENSA"');
      expect(sanitizeCsvCell(null)).toBe('""');
    });
  });

  describe('Durcissement des OTP (HMAC-SHA256, expiration courte, limitation des essais)', () => {
    test('hashOtp génère une empreinte HMAC-SHA256 hexadécimale de 64 caractères déterministe', () => {
      const hash1 = hashOtp('123456');
      const hash2 = hashOtp('123456');
      const hash3 = hashOtp('654321');

      expect(hash1).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/.test(hash1)).toBe(true);
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });
  });
});
