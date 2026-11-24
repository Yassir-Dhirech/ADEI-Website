'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');

    if (!table.status) {
      await queryInterface.addColumn('users', 'status', {
        type: Sequelize.ENUM('pending', 'active', 'rejected'),
        allowNull: false,
        defaultValue: 'active' // Par défaut 'active' pour ne pas bloquer les comptes existants
      });
    }

    if (!table.phone) {
      await queryInterface.addColumn('users', 'phone', {
        type: Sequelize.STRING(30),
        allowNull: true
      });
    }

    if (!table.filiere) {
      await queryInterface.addColumn('users', 'filiere', {
        type: Sequelize.STRING(50),
        allowNull: true
      });
    }

    if (!table.classe) {
      await queryInterface.addColumn('users', 'classe', {
        type: Sequelize.STRING(50),
        allowNull: true
      });
    }

    if (!table.requested_role) {
      await queryInterface.addColumn('users', 'requested_role', {
        type: Sequelize.ENUM('user', 'president', 'delegue'),
        allowNull: false,
        defaultValue: 'user'
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('users');

    if (table.requested_role) await queryInterface.removeColumn('users', 'requested_role');
    if (table.classe) await queryInterface.removeColumn('users', 'classe');
    if (table.filiere) await queryInterface.removeColumn('users', 'filiere');
    if (table.phone) await queryInterface.removeColumn('users', 'phone');
    if (table.status) {
      await queryInterface.removeColumn('users', 'status');
      try {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_status";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_requested_role";');
      } catch {
        // Ignorer si dialecte non-Postgres
      }
    }
  }
};
