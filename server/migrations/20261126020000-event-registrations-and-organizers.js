'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Assurer l'existence de la table event_registrations
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('event_registrations')) {
      await queryInterface.createTable('event_registrations', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        eventId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'events', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        guestName: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        guestEmail: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        guestPhone: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        guestFiliere: {
          type: Sequelize.STRING(100),
          allowNull: true
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
    } else {
      // Table déjà existante : aligner les colonnes de manière idempotente
      const regCols = await queryInterface.describeTable('event_registrations');

      // Autoriser userId à être NULL pour les inscriptions invités
      await queryInterface.changeColumn('event_registrations', 'userId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      if (!regCols.guestName && !regCols.guestname) {
        await queryInterface.addColumn('event_registrations', 'guestName', {
          type: Sequelize.STRING(255),
          allowNull: true
        });
      }
      if (!regCols.guestEmail && !regCols.guestemail) {
        await queryInterface.addColumn('event_registrations', 'guestEmail', {
          type: Sequelize.STRING(255),
          allowNull: true
        });
      }
      if (!regCols.guestPhone && !regCols.guestphone) {
        await queryInterface.addColumn('event_registrations', 'guestPhone', {
          type: Sequelize.STRING(50),
          allowNull: true
        });
      }
      if (!regCols.guestFiliere && !regCols.guestfiliere) {
        await queryInterface.addColumn('event_registrations', 'guestFiliere', {
          type: Sequelize.STRING(100),
          allowNull: true
        });
      }
    }

    // 2. Supprimer l'ancienne contrainte d'unicité si elle existe
    try {
      await queryInterface.removeIndex('event_registrations', 'unique_user_event_registration');
    } catch (_) {
      // Ignore si l'index n'existait pas
    }

    // 3. Index partiel d'unicité pour les étudiants connectés (userId IS NOT NULL)
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_user_event_registration
      ON event_registrations ("eventId", "userId")
      WHERE "userId" IS NOT NULL;
    `);

    // 4. Index partiel d'unicité pour les invités (userId IS NULL)
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_guest_event_registration
      ON event_registrations ("eventId", "guestEmail")
      WHERE "userId" IS NULL;
    `);

    // 5. Assurer l'existence de la table event_organizers
    if (!tables.includes('event_organizers')) {
      await queryInterface.createTable('event_organizers', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        eventId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'events', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        clubId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'clubs', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        organizerName: {
          type: Sequelize.STRING(255),
          allowNull: false
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

      await queryInterface.addIndex('event_organizers', ['eventId', 'organizerName'], {
        name: 'idx_event_organizers_event_name'
      });
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS unique_guest_event_registration;
        DROP INDEX IF EXISTS unique_user_event_registration;
      `);
    } catch (_) {}

    const tables = await queryInterface.showAllTables();
    if (tables.includes('event_organizers')) {
      await queryInterface.dropTable('event_organizers');
    }

    if (tables.includes('event_registrations')) {
      const regCols = await queryInterface.describeTable('event_registrations');
      if (regCols.guestName || regCols.guestname) await queryInterface.removeColumn('event_registrations', 'guestName');
      if (regCols.guestEmail || regCols.guestemail) await queryInterface.removeColumn('event_registrations', 'guestEmail');
      if (regCols.guestPhone || regCols.guestphone) await queryInterface.removeColumn('event_registrations', 'guestPhone');
      if (regCols.guestFiliere || regCols.guestfiliere) await queryInterface.removeColumn('event_registrations', 'guestFiliere');
    }
  }
};
