'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('audit_logs')) {
      await queryInterface.createTable('audit_logs', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        action: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        resourceType: {
          type: Sequelize.STRING(50),
          allowNull: false
        },
        resourceId: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        details: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        ipAddress: {
          type: Sequelize.STRING(45),
          allowNull: true
        },
        userAgent: {
          type: Sequelize.STRING(255),
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

      await queryInterface.addIndex('audit_logs', ['action']);
      await queryInterface.addIndex('audit_logs', ['resourceType']);
      await queryInterface.addIndex('audit_logs', ['createdAt']);
      await queryInterface.addIndex('audit_logs', ['userId']);
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('audit_logs')) {
      await queryInterface.dropTable('audit_logs');
    }
  }
};
