import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sequelize, User, Club, ClubMember } from '../models';

async function seedTestAccounts() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données PostgreSQL Neon réussie !');

    // Réaligner la séquence ID de PostgreSQL avec le max(id) réel
    try {
      await sequelize.query(`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(max(id), 1)) FROM "users";`);
      await sequelize.query(`SELECT setval(pg_get_serial_sequence('clubs', 'id'), COALESCE(max(id), 1)) FROM "clubs";`);
      await sequelize.query(`SELECT setval(pg_get_serial_sequence('events', 'id'), COALESCE(max(id), 1)) FROM "events";`);
    } catch (seqErr) {
      console.warn('Note réalignement séquence:', seqErr.message);
    }

    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminADEI2026!';
    const presidentPassword = 'President2026!';
    const studentPassword = 'Student2026!';

    const adminHash = await bcrypt.hash(adminPassword, 10);
    const presidentHash = await bcrypt.hash(presidentPassword, 10);
    const studentHash = await bcrypt.hash(studentPassword, 10);

    // 1. Super Administrateur ADEI
    const [adminUser] = await User.findOrCreate({
      where: { email: 'admin@adei-ensaf.ma' },
      defaults: {
        username: 'admin_adei',
        email: 'admin@adei-ensaf.ma',
        password: adminHash,
        role: 'admin',
        is_bureau_adei: true
      }
    });
    await adminUser.update({
      password: adminHash,
      role: 'admin',
      is_bureau_adei: true
    });
    console.log(`👑 Super Admin configuré :`);
    console.log(`   Email:    admin@adei-ensaf.ma`);
    console.log(`   Password: ${adminPassword}`);

    // 2. Assurer l'existence d'un club cible
    let targetClub = await Club.findOne();
    if (!targetClub) {
      targetClub = await Club.create({
        club: 'Club Informatique & IA (CIT)',
        president: 'Salma Benali',
        annees_etude: '2ème année Génie Informatique',
        tel: '0661234567',
        email: 'tech.ai@adei-ensaf.ma',
        description: 'Club officiel de développement et IA de l\'ENSAF'
      });
    }

    // 3. Président de Club
    const [presidentUser] = await User.findOrCreate({
      where: { email: 'president.tech@adei-ensaf.ma' },
      defaults: {
        username: 'pres_tech_ai',
        email: 'president.tech@adei-ensaf.ma',
        password: presidentHash,
        role: 'user',
        is_president: true
      }
    });
    await presidentUser.update({
      password: presidentHash,
      is_president: true
    });

    // Assigner le mandat de président actif (2025-2026)
    try {
      await ClubMember.findOrCreate({
        where: {
          userId: presidentUser.id,
          clubId: targetClub.id,
          academicYear: '2025-2026'
        },
        defaults: {
          userId: presidentUser.id,
          clubId: targetClub.id,
          role: 'president',
          status: 'active',
          academicYear: '2025-2026',
          pole: 'Bureau Exécutif'
        }
      });
    } catch {
      console.log('   (Note: La table club_members sera peuplée dès que la migration sera lancée)');
    }

    console.log(`🏢 Président de Club configuré :`);
    console.log(`   Email:    president.tech@adei-ensaf.ma`);
    console.log(`   Password: ${presidentPassword}`);

    // 4. Compte Étudiant Standard
    const [studentUser] = await User.findOrCreate({
      where: { email: 'etudiant@adei-ensaf.ma' },
      defaults: {
        username: 'etudiant_ensaf',
        email: 'etudiant@adei-ensaf.ma',
        password: studentHash,
        role: 'user'
      }
    });
    await studentUser.update({
      password: studentHash,
      role: 'user'
    });
    console.log(`🎓 Étudiant configuré :`);
    console.log(`   Email:    etudiant@adei-ensaf.ma`);
    console.log(`   Password: ${studentPassword}`);

    console.log('\n✨ Tous les comptes de test sont prêts et enregistrés en base !');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la configuration des comptes:', error);
    process.exit(1);
  }
}

seedTestAccounts();
