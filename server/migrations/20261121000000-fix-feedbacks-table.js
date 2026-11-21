'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Harmoniser le nom de la colonne isPublished si elle est en minuscules (import SQL brut)
    try {
      const table = await queryInterface.describeTable('feedbacks');
      if (table.ispublished && !table.isPublished) {
        await queryInterface.renameColumn('feedbacks', 'ispublished', 'isPublished');
      }
    } catch (e) {
      console.warn('[Migration fix feedbacks] Column check warning:', e.message);
    }

    // 2. Resynchroniser la séquence PostgreSQL feedbacks_id_seq avec MAX(id)
    try {
      await queryInterface.sequelize.query(`
        SELECT setval('feedbacks_id_seq', COALESCE((SELECT MAX(id) FROM feedbacks), 0) + 1, false);
      `);
    } catch (e) {
      console.warn('[Migration fix feedbacks] Sequence resync warning:', e.message);
    }
  },

  async down(queryInterface) {
    // Aucune action nécessaire en rollback
  }
};
