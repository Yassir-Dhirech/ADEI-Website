'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('events');

    if (!table.status) {
      await queryInterface.addColumn('events', 'status', {
        type: Sequelize.ENUM('draft', 'pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'approved' // Règle d'or : les anciens événements restent visibles
      });
    }

    if (!table.submittedBy) {
      await queryInterface.addColumn('events', 'submittedBy', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!table.reviewedBy) {
      await queryInterface.addColumn('events', 'reviewedBy', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!table.reviewedAt) {
      await queryInterface.addColumn('events', 'reviewedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!table.rejectionReason) {
      await queryInterface.addColumn('events', 'rejectionReason', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('events');

    if (table.rejectionReason) await queryInterface.removeColumn('events', 'rejectionReason');
    if (table.reviewedAt) await queryInterface.removeColumn('events', 'reviewedAt');
    if (table.reviewedBy) await queryInterface.removeColumn('events', 'reviewedBy');
    if (table.submittedBy) await queryInterface.removeColumn('events', 'submittedBy');
    if (table.status) {
      await queryInterface.removeColumn('events', 'status');
      try {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_events_status";');
      } catch {
        // Ignorer si dialecte non-Postgres
      }
    }
  }
};
