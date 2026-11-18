'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('adei_members');
    if (!table.mandate) {
      await queryInterface.addColumn('adei_members', 'mandate', {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: '2025/2026'
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('adei_members');
    if (table.mandate) {
      await queryInterface.removeColumn('adei_members', 'mandate');
    }
  }
};
