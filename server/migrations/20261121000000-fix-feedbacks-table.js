'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('feedbacks');

    // 1. Ajouter la colonne isPublished si manquante (cas import SQL initial)
    if (!table.isPublished && !table.ispublished) {
      await queryInterface.addColumn('feedbacks', 'isPublished', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    } else if (table.ispublished && !table.isPublished) {
      await queryInterface.renameColumn('feedbacks', 'ispublished', 'isPublished');
    }

    // 2. Ajouter la colonne userId si manquante
    if (!table.userId && !table.userid) {
      await queryInterface.addColumn('feedbacks', 'userId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
    }

    // 3. Resynchroniser la séquence auto-increment de PostgreSQL (évite l'erreur duplicate key)
    try {
      await queryInterface.sequelize.query(`
        SELECT setval('feedbacks_id_seq', COALESCE((SELECT MAX(id) FROM feedbacks), 0) + 1, false);
      `);
    } catch (e) {
      console.warn('[Migration fix feedbacks] Sequence resync warning:', e.message);
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('feedbacks');
    if (table.userId) await queryInterface.removeColumn('feedbacks', 'userId');
    if (table.isPublished) await queryInterface.removeColumn('feedbacks', 'isPublished');
  }
};
