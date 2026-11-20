'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.showAllTables();
    if (!existing.includes('event_registrations')) {
      await queryInterface.createTable('event_registrations', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        eventId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'events',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW')
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW')
        }
      });

      // Contrainte d'unicité : un utilisateur ne peut s'inscrire qu'une seule fois au même événement
      await queryInterface.addIndex('event_registrations', ['userId', 'eventId'], {
        unique: true,
        name: 'unique_user_event_registration'
      });
    }
  },

  async down(queryInterface) {
    const existing = await queryInterface.showAllTables();
    if (existing.includes('event_registrations')) {
      await queryInterface.dropTable('event_registrations');
    }
  }
};
