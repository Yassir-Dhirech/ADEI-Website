'use strict';

const DEFAULT_ADEI_ROLES = [
  { name: 'President', tier: 1, position: 1 },
  { name: 'Vice President', tier: 1, position: 2 },
  { name: 'Secrétaire Générale', tier: 1, position: 3 },
  { name: 'Trésorier', tier: 1, position: 4 },
  { name: 'Conseillers', tier: 1, position: 5 },
  { name: 'Représentant des étudiants étrangers', tier: 2, position: 1 },
  { name: 'Représentant des Lauréats', tier: 2, position: 2 },
  { name: 'IT Manager', tier: 3, position: 1 },
  { name: 'IT Team', tier: 3, position: 2 },
  { name: 'Affaires Administratives', tier: 3, position: 3 },
  { name: 'Responsable Media', tier: 3, position: 4 },
  { name: 'Responsable Interne', tier: 3, position: 5 },
  { name: 'Responsables Sponsoring', tier: 3, position: 6 },
  { name: 'Responsables Création & Design', tier: 3, position: 7 }
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const timestamps = {
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    };

    // 1. Table adei_roles (avec tier et position)
    await queryInterface.createTable('adei_roles', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      tier: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 3 },
      position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      ...timestamps
    });

    const now = new Date();
    await queryInterface.bulkInsert(
      'adei_roles',
      DEFAULT_ADEI_ROLES.map((r) => ({ ...r, createdAt: now, updatedAt: now }))
    );

    // Lier adei_members.roleId -> adei_roles.id et migrer les membres existants
    const membersDesc = await queryInterface.describeTable('adei_members');
    if (!membersDesc.roleId) {
      await queryInterface.addColumn('adei_members', 'roleId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'adei_roles', key: 'id' },
        onDelete: 'SET NULL'
      });
    }
    await queryInterface.sequelize.query(`
      UPDATE "adei_members" m
      SET "roleId" = r.id
      FROM "adei_roles" r
      WHERE m.role::text = r.name;
    `);

    // 2. Structure académique : cycles -> academic_years -> sections
    await queryInterface.createTable('cycles', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      code: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      order_display: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      ...timestamps
    });

    await queryInterface.bulkInsert('cycles', [
      { code: 'CP', name: 'Cycle Préparatoire', order_display: 1, createdAt: now, updatedAt: now },
      { code: 'CI', name: 'Cycle Ingénieur', order_display: 2, createdAt: now, updatedAt: now }
    ]);

    await queryInterface.createTable('academic_years', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      cycleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'cycles', key: 'id' },
        onDelete: 'CASCADE'
      },
      filiereId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'filieres', key: 'id' },
        onDelete: 'CASCADE'
      },
      name: { type: Sequelize.STRING(100), allowNull: false },
      yearNumber: { type: Sequelize.INTEGER, allowNull: false },
      delegateName: { type: Sequelize.STRING(255), allowNull: true },
      delegatePhone: { type: Sequelize.STRING(20), allowNull: true },
      drive: { type: Sequelize.STRING(1000), allowNull: true },
      documentation: { type: Sequelize.STRING(1000), allowNull: true },
      order_display: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      ...timestamps
    });

    await queryInterface.createTable('sections', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      academicYearId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'academic_years', key: 'id' },
        onDelete: 'CASCADE'
      },
      name: { type: Sequelize.STRING(50), allowNull: false },
      delegateName: { type: Sequelize.STRING(255), allowNull: true },
      delegatePhone: { type: Sequelize.STRING(20), allowNull: true },
      ...timestamps
    });

    // Migrer les filières existantes (CP et Ingénieur) vers academic_years + sections
    const [cycles] = await queryInterface.sequelize.query(`SELECT id, code FROM "cycles"`);
    const cpCycle = cycles.find((c) => c.code === 'CP');
    const ciCycle = cycles.find((c) => c.code === 'CI');
    const [filieres] = await queryInterface.sequelize.query(`SELECT * FROM "filieres"`);

    for (const f of filieres) {
      if (f.type === 'prepa' && cpCycle) {
        for (const yr of [1, 2]) {
          const [[insertedYear]] = await queryInterface.sequelize.query(
            `INSERT INTO "academic_years" ("cycleId", "filiereId", name, "yearNumber", drive, documentation, order_display, "createdAt", "updatedAt")
             VALUES (:cycleId, :filiereId, :name, :yr, :drive, :doc, :yr, NOW(), NOW()) RETURNING id`,
            { replacements: { cycleId: cpCycle.id, filiereId: f.id, name: `CP${yr}`, yr, drive: f.drive, doc: f.documentation } }
          );
          for (const sec of ['a', 'b', 'c']) {
            await queryInterface.sequelize.query(
              `INSERT INTO "sections" ("academicYearId", name, "delegateName", "delegatePhone", "createdAt", "updatedAt")
               VALUES (:yearId, :secName, :delName, :delPhone, NOW(), NOW())`,
              {
                replacements: {
                  yearId: insertedYear.id,
                  secName: `Section ${sec.toUpperCase()}`,
                  delName: f[`delegue_cp${yr}_${sec}`] || null,
                  delPhone: f[`tel_delegue_cp${yr}_${sec}`] || null
                }
              }
            );
          }
        }
      } else if (ciCycle) {
        for (const yr of [1, 2, 3]) {
          await queryInterface.sequelize.query(
            `INSERT INTO "academic_years" ("cycleId", "filiereId", name, "yearNumber", "delegateName", "delegatePhone", drive, documentation, order_display, "createdAt", "updatedAt")
             VALUES (:cycleId, :filiereId, :name, :yr, :delName, :delPhone, :drive, :doc, :yr, NOW(), NOW())`,
            {
              replacements: {
                cycleId: ciCycle.id,
                filiereId: f.id,
                name: `${f.abbreviation}${yr}`,
                yr,
                delName: f[`delegue_annee${yr}`] || null,
                delPhone: f[`tel_delegue_annee${yr}`] || null,
                drive: f.drive,
                doc: f.documentation
              }
            }
          );
        }
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sections');
    await queryInterface.dropTable('academic_years');
    await queryInterface.dropTable('cycles');
    await queryInterface.removeColumn('adei_members', 'roleId');
    await queryInterface.dropTable('adei_roles');
  }
};