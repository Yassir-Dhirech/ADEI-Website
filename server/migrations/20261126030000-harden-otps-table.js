'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('otps');

    // 1. Agrandir la colonne code pour accueillir les hashs HMAC-SHA256 (64 caractères)
    if (table.code) {
      await queryInterface.changeColumn('otps', 'code', {
        type: Sequelize.STRING(255),
        allowNull: false
      });
    }

    // 2. Ajouter la colonne attempts si elle n'existe pas
    if (!table.attempts) {
      await queryInterface.addColumn('otps', 'attempts', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('otps');
    if (table.attempts) {
      await queryInterface.removeColumn('otps', 'attempts');
    }
    if (table.code) {
      await queryInterface.changeColumn('otps', 'code', {
        type: Sequelize.STRING(10),
        allowNull: false
      });
    }
  }
};
