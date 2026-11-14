require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { User } = require('../models');

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.trim() : null;
  const username = process.env.ADMIN_USERNAME ? process.env.ADMIN_USERNAME.trim() : null;
  const password = process.env.ADMIN_PASSWORD;

  // 1. Validate required fields
  if (!email || !username || !password) {
    console.error('❌ ERREUR: ADMIN_EMAIL, ADMIN_USERNAME et ADMIN_PASSWORD doivent être définis dans les variables d\'environnement.');
    process.exit(1);
  }

  // 2. Validate password strength (minimum 12 characters)
  if (password.length < 12) {
    console.error('❌ ERREUR: Le mot de passe administrateur doit contenir au moins 12 caractères pour des raisons de sécurité.');
    process.exit(1);
  }

  try {
    await sequelize.authenticate();

    // 3. Idempotency check: see if admin with this email or username already exists
    const { Op } = require('sequelize');
    const existingAdmin = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });


// APRÈS :
if (existingAdmin) {
  const hashedPassword = await bcrypt.hash(password, 10);
  await existingAdmin.update({
    email,
    password: hashedPassword,
    role: 'admin'
  });
  console.log(`✅ Administrateur "${existingAdmin.username}" (${email}) synchronisé avec succès avec le mot de passe du .env (ID: ${existingAdmin.id})!`);
  process.exit(0);
}

    // 4. Hash password and create admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'admin',
      is_bureau_adei: true
    });

    console.log(`✅ Administrateur "${username}" (${email}) créé avec succès avec le rôle 'admin' (ID: ${newAdmin.id})!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'administrateur:', error.message);
    process.exit(1);
  }
}

createAdmin();