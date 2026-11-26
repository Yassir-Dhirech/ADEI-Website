'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('filieres');

    if (!table.drives) {
      await queryInterface.addColumn('filieres', 'drives', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('filieres');
    if (table.drives) {
      await queryInterface.removeColumn('filieres', 'drives');
    }
  }
};
