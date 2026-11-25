'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('clubs');

    if (!table.pendingUpdates && !table.pendingupdates) {
      await queryInterface.addColumn('clubs', 'pendingUpdates', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null
      });
    }

    if (!table.pendingUpdatesSubmittedBy && !table.pendingupdatessubmittedby) {
      await queryInterface.addColumn('clubs', 'pendingUpdatesSubmittedBy', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!table.pendingUpdatesAt && !table.pendingupdatesat) {
      await queryInterface.addColumn('clubs', 'pendingUpdatesAt', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('clubs');
    if (table.pendingUpdates || table.pendingupdates) {
      await queryInterface.removeColumn('clubs', 'pendingUpdates');
    }
    if (table.pendingUpdatesSubmittedBy || table.pendingupdatessubmittedby) {
      await queryInterface.removeColumn('clubs', 'pendingUpdatesSubmittedBy');
    }
    if (table.pendingUpdatesAt || table.pendingupdatesat) {
      await queryInterface.removeColumn('clubs', 'pendingUpdatesAt');
    }
  }
};