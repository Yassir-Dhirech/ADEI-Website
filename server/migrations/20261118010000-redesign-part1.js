'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Ajouter order_display sur events (pour ne plus jamais échanger createdAt)
    const eventsDesc = await queryInterface.describeTable('events');
    if (!eventsDesc.order_display) {
      await queryInterface.addColumn('events', 'order_display', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    }

    // Initialiser un order_display séquentiel sur news et events
    await queryInterface.sequelize.query(`
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" DESC) - 1 AS rn FROM "news"
      )
      UPDATE "news" n SET "order_display" = r.rn FROM ranked r WHERE n.id = r.id;
    `);
    await queryInterface.sequelize.query(`
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" DESC) - 1 AS rn FROM "events"
      )
      UPDATE "events" e SET "order_display" = r.rn FROM ranked r WHERE e.id = r.id;
    `);

    // 2. Convertir clubs.activities et clubs.achievements en JSONB natif PostgreSQL
    for (const col of ['activities', 'achievements']) {
      await queryInterface.sequelize.query(`
        ALTER TABLE "clubs"
          ALTER COLUMN "${col}" DROP DEFAULT,
          ALTER COLUMN "${col}" TYPE JSONB USING (
            CASE
              WHEN "${col}" IS NULL OR btrim("${col}") = '' THEN '[]'::jsonb
              WHEN left(btrim("${col}"), 1) IN ('[', '{') THEN "${col}"::jsonb
              ELSE to_jsonb(string_to_array("${col}", ','))
            END
          ),
          ALTER COLUMN "${col}" SET DEFAULT '[]'::jsonb;
      `);
    }

    // 3. Table de jointure feedback_likes (1 like max par utilisateur et par feedback)
    await queryInterface.createTable('feedback_likes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      feedbackId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'feedbacks', key: 'id' },
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('feedback_likes', ['feedbackId', 'userId'], {
      unique: true,
      name: 'feedback_likes_unique_pair'
    });

    // 4. Table pivot event_organizers (plusieurs co-organisateurs par événement)
    await queryInterface.createTable('event_organizers', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      eventId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'events', key: 'id' },
        onDelete: 'CASCADE'
      },
      clubId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'clubs', key: 'id' },
        onDelete: 'SET NULL'
      },
      organizerName: { type: Sequelize.STRING(255), allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // Migrer les organisateurs d'événements existants dans la table pivot
    await queryInterface.sequelize.query(`
      INSERT INTO "event_organizers" ("eventId", "clubId", "organizerName", "createdAt", "updatedAt")
      SELECT id, "clubId", COALESCE("organizer", 'ADEI'), NOW(), NOW()
      FROM "events";
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('event_organizers');
    await queryInterface.dropTable('feedback_likes');
    for (const col of ['activities', 'achievements']) {
      await queryInterface.sequelize.query(`
        ALTER TABLE "clubs"
          ALTER COLUMN "${col}" DROP DEFAULT,
          ALTER COLUMN "${col}" TYPE TEXT USING "${col}"::text,
          ALTER COLUMN "${col}" SET DEFAULT '';
      `);
    }
    await queryInterface.removeColumn('events', 'order_display');
  }
};