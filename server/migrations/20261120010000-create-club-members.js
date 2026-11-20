'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.showAllTables();
    if (!existing.includes('club_members')) {
      await queryInterface.createTable('club_members', {
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
        clubId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'clubs',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        role: {
          type: Sequelize.ENUM('president', 'manager', 'member'),
          allowNull: false,
          defaultValue: 'member'
        },
        academicYear: {
          type: Sequelize.STRING(20),
          allowNull: false
        },
        status: {
          type: Sequelize.ENUM('pending', 'active', 'rejected', 'left'),
          allowNull: false,
          defaultValue: 'pending'
        },
        pole: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        motivation: {
          type: Sequelize.TEXT,
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

      // Contrainte d'unicité : un utilisateur ne peut avoir qu'une seule entrée par club pour une même année scolaire
      await queryInterface.addIndex('club_members', ['userId', 'clubId', 'academicYear'], {
        unique: true,
        name: 'unique_user_club_academic_year'
      });
    }
  },

  async down(queryInterface) {
    const existing = await queryInterface.showAllTables();
    if (existing.includes('club_members')) {
      await queryInterface.dropTable('club_members');
    }
    // Nettoyage des types ENUM sous PostgreSQL
    try {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_club_members_role";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_club_members_status";');
    } catch {
      // Ignorer si dialecte non-Postgres
    }
  }
};
