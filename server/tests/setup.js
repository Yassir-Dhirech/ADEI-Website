const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { sequelize, User } = require('../models');

/**
 * Garde-fou de sécurité : empêche les tests de tourner sur une autre base que adei_test.
 */
function assertTestDatabase() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      `🚨 SÉCURITÉ : Les tests doivent tourner avec NODE_ENV=test (reçu : "${process.env.NODE_ENV}").`
    );
  }
  if (env.DB.name !== 'adei_test') {
    throw new Error(
      `🚨 SÉCURITÉ : Refus d'effacer la base "${env.DB.name}". Les tests ne sont autorisés QUE sur "adei_test" !`
    );
  }
}

/**
 * Réinitialise la base de test et crée un compte admin + un compte utilisateur standard.
 */
async function resetTestDatabase() {
  assertTestDatabase();

  await sequelize.authenticate();
  await sequelize.sync({ force: true });

  const adminPasswordHash = await bcrypt.hash('AdminTest123!', 10);
  const userPasswordHash = await bcrypt.hash('UserTest123!', 10);

  const adminUser = await User.create({
    username: 'test_admin',
    email: 'admin@test.ma',
    password: adminPasswordHash,
    role: 'admin',
    is_bureau_adei: true
  });

  const normalUser = await User.create({
    username: 'test_student',
    email: 'student@test.ma',
    password: userPasswordHash,
    role: 'user'
  });

  return { adminUser, normalUser };
}

module.exports = { assertTestDatabase, resetTestDatabase, sequelize };
