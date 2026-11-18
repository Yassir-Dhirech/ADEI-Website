'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.showAllTables();
    const hasTable = (name) => existing.includes(name);

    const timestamps = {
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    };

    // 1. users
    if (!hasTable('users')) {
      await queryInterface.createTable('users', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        username: { type: Sequelize.STRING(50), allowNull: false, unique: true },
        email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
        password: { type: Sequelize.STRING(255), allowNull: false },
        role: { type: Sequelize.ENUM('user', 'admin'), defaultValue: 'user' },
        is_president: { type: Sequelize.BOOLEAN, defaultValue: false },
        is_representant: { type: Sequelize.BOOLEAN, defaultValue: false },
        is_membre_adei: { type: Sequelize.BOOLEAN, defaultValue: false },
        is_bureau_adei: { type: Sequelize.BOOLEAN, defaultValue: false },
        lastPasswordChange: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
        ...timestamps
      });
    }

    // 2. clubs
    if (!hasTable('clubs')) {
      await queryInterface.createTable('clubs', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        club: { type: Sequelize.STRING(255), allowNull: false },
        president: { type: Sequelize.STRING(255), allowNull: false },
        annees_etude: { type: Sequelize.STRING(100), allowNull: false },
        tel: { type: Sequelize.STRING(20), allowNull: false },
        email: { type: Sequelize.STRING(255), allowNull: false },
        website: { type: Sequelize.STRING(500), defaultValue: '' },
        image: { type: Sequelize.STRING(500), defaultValue: '' },
        description: { type: Sequelize.TEXT, defaultValue: '' },
        activities: { type: Sequelize.TEXT, defaultValue: '' },
        achievements: { type: Sequelize.TEXT, defaultValue: '' },
        members: { type: Sequelize.INTEGER, defaultValue: 0 },
        facebook: { type: Sequelize.STRING(500), defaultValue: '' },
        instagram: { type: Sequelize.STRING(500), defaultValue: '' },
        linkedin: { type: Sequelize.STRING(500), defaultValue: '' },
        ...timestamps
      });
    }

    // 3. filieres
    if (!hasTable('filieres')) {
      await queryInterface.createTable('filieres', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: Sequelize.STRING(500), allowNull: false },
        abbreviation: { type: Sequelize.STRING(20), allowNull: false, unique: true },
        type: { type: Sequelize.ENUM('filiere', 'prepa'), allowNull: false, defaultValue: 'filiere' },
        documentation: { type: Sequelize.STRING(1000), allowNull: true },
        drive: { type: Sequelize.STRING(1000), allowNull: true },
        description: { type: Sequelize.TEXT, allowNull: true },
        isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
        order_display: { type: Sequelize.INTEGER, defaultValue: 0 },
        responsable_pedagogique: { type: Sequelize.STRING(255), allowNull: true },
        responsable_contact: { type: Sequelize.STRING(255), allowNull: true },
        delegue_cp1_a: { type: Sequelize.STRING(255), allowNull: true },
        tel_delegue_cp1_a: { type: Sequelize.STRING(20), allowNull: true },
        delegue_cp1_b: { type: Sequelize.STRING(255), allowNull: true },
        tel_delegue_cp1_b: { type: Sequelize.STRING(20), allowNull: true },
        delegue_cp1_c: { type: Sequelize.STRING(255), allowNull: true },
        tel_delegue_cp1_c: { type: Sequelize.STRING(20), allowNull: true },
        delegue_cp2_a: { type: Sequelize.STRING(255), allowNull: true },
        tel_delegue_cp2_a: { type: Sequelize.STRING(20), allowNull: true },
        delegue_cp2_b: { type: Sequelize.STRING(255), allowNull: true },
        tel_delegue_cp2_b: { type: Sequelize.STRING(20), allowNull: true },
        delegue_cp2_c: { type: Sequelize.STRING(255), allowNull: true },
        tel_delegue_cp2_c: { type: Sequelize.STRING(20), allowNull: true },
        delegue_annee1: { type: Sequelize.STRING(255), allowNull: true },
        tel_delegue_annee1: { type: Sequelize.STRING(20), allowNull: true },
        delegue_annee2: { type: Sequelize.STRING(255), allowNull: true },
        tel_delegue_annee2: { type: Sequelize.STRING(20), allowNull: true },
        delegue_annee3: { type: Sequelize.STRING(255), allowNull: true },
        tel_delegue_annee3: { type: Sequelize.STRING(20), allowNull: true },
        ...timestamps
      });
      await queryInterface.addIndex('filieres', ['abbreviation']);
      await queryInterface.addIndex('filieres', ['type']);
      await queryInterface.addIndex('filieres', ['isActive']);
      await queryInterface.addIndex('filieres', ['order_display']);
    }

    // 4. adei_members
    if (!hasTable('adei_members')) {
      await queryInterface.createTable('adei_members', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: Sequelize.STRING(255), allowNull: false },
        role: {
          type: Sequelize.ENUM(
            'President', 'Vice President', 'Secrétaire Générale', 'Trésorier',
            'Conseillers', 'IT Manager', 'IT Team', 'Représentant des étudiants étrangers',
            'Représentant des Lauréats', 'Affaires Administratives', 'Responsable Media',
            'Responsable Interne', 'Responsables Sponsoring', 'Responsables Création & Design'
          ),
          allowNull: false
        },
        email: { type: Sequelize.STRING(255), allowNull: false },
        photo: { type: Sequelize.STRING(500), defaultValue: '/images/default.jpg' },
        ...timestamps
      });
    }

    // 5. partners
    if (!hasTable('partners')) {
      await queryInterface.createTable('partners', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: Sequelize.STRING(255), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        website: { type: Sequelize.STRING(500), allowNull: true },
        logo: { type: Sequelize.STRING(500), allowNull: true, defaultValue: '/images/default.jpg' },
        facebook: { type: Sequelize.STRING(500), allowNull: true },
        instagram: { type: Sequelize.STRING(500), allowNull: true },
        whatsapp: { type: Sequelize.STRING(500), allowNull: true },
        isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
        order_display: { type: Sequelize.INTEGER, defaultValue: 0 },
        ...timestamps
      });
    }

    // 6. news (référence clubs)
    if (!hasTable('news')) {
      await queryInterface.createTable('news', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        title: { type: Sequelize.STRING(255), allowNull: false },
        content: { type: Sequelize.TEXT, allowNull: false },
        date: { type: Sequelize.DATEONLY, allowNull: false },
        clubId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'clubs', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        organizer: { type: Sequelize.STRING(255), allowNull: true, defaultValue: 'ADEI' },
        image: { type: Sequelize.STRING(500), allowNull: true },
        document: { type: Sequelize.STRING(500), allowNull: true },
        link: { type: Sequelize.STRING(500), allowNull: true },
        category: { type: Sequelize.STRING(100), allowNull: true, defaultValue: 'autre' },
        order_display: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
        ...timestamps
      });
    }

    // 7. events (référence clubs)
    if (!hasTable('events')) {
      await queryInterface.createTable('events', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        title: { type: Sequelize.STRING(255), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: false },
        date: { type: Sequelize.DATEONLY, allowNull: false },
        time: { type: Sequelize.STRING(50), allowNull: false },
        location: { type: Sequelize.STRING(255), allowNull: false },
        category: { type: Sequelize.STRING(100), defaultValue: '' },
        clubId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'clubs', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        organizer: { type: Sequelize.STRING(255), allowNull: true, defaultValue: 'ADEI' },
        image: { type: Sequelize.STRING(500), allowNull: true },
        document: { type: Sequelize.STRING(500), allowNull: true },
        link: { type: Sequelize.STRING(500), allowNull: true },
        ...timestamps
      });
    }

    // 8. feedbacks (référence users)
    if (!hasTable('feedbacks')) {
      await queryInterface.createTable('feedbacks', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: Sequelize.STRING(255), allowNull: false },
        email: { type: Sequelize.STRING(255), allowNull: false },
        type: { type: Sequelize.ENUM('avis', 'recommandation', 'autre'), allowNull: false },
        message: { type: Sequelize.TEXT, allowNull: false },
        read: { type: Sequelize.BOOLEAN, defaultValue: false },
        isPublished: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
        userId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        ...timestamps
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('feedbacks');
    await queryInterface.dropTable('events');
    await queryInterface.dropTable('news');
    await queryInterface.dropTable('partners');
    await queryInterface.dropTable('adei_members');
    await queryInterface.dropTable('filieres');
    await queryInterface.dropTable('clubs');
    await queryInterface.dropTable('users');
  }
};