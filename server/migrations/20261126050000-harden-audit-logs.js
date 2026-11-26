'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('audit_logs');

    if (!table.actorEmail && !table.actoremail) {
      await queryInterface.addColumn('audit_logs', 'actorEmail', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }

    if (!table.actorRole && !table.actorrole) {
      await queryInterface.addColumn('audit_logs', 'actorRole', {
        type: Sequelize.STRING(50),
        allowNull: true
      });
    }

    try {
      await queryInterface.addIndex('audit_logs', ['actorEmail']);
    } catch (_) {
      // Ignore if index already exists
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('audit_logs');
    if (table.actorEmail || table.actoremail) {
      await queryInterface.removeColumn('audit_logs', 'actorEmail');
    }
    if (table.actorRole || table.actorrole) {
      await queryInterface.removeColumn('audit_logs', 'actorRole');
    }
  }
};
