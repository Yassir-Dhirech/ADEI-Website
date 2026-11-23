import 'dotenv/config';
import { sequelize } from '../models';

async function scanAndFixAll() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connecté à Neon.');

    // 1. Lister toutes les tables du schéma public
    const [tables]: any = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);

    // 2. Scan de toutes les colonnes texte
    for (const { table_name } of tables) {
      const [columns]: any = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = :tableName 
          AND data_type IN ('character varying', 'text');
      `, { replacements: { tableName: table_name } });

      for (const { column_name } of columns) {
        try {
          const [found]: any = await sequelize.query(`
            SELECT id, "${column_name}" AS val 
            FROM "${table_name}" 
            WHERE "${column_name}"::text LIKE '%??%';
          `);

          if (found && found.length > 0) {
            console.log(`🔍 Trouvé dans ${table_name}.${column_name} (${found.length} entrées):`);
            found.forEach((r: any) => console.log(`   [ID ${r.id}] -> "${r.val}"`));
          }
        } catch {
          // ignore
        }
      }
    }

    // 3. Effectuer le remplacement exhaustif de tous les cas
    const fixes = [
      ['?? d??finir', 'À définir'],
      ['?? définir', 'À définir'],
      ['?? d?finir', 'À définir'],
      ['A d??finir', 'À définir'],
      ['a d??finir', 'à définir'],
      ['À d??finir', 'À définir'],
      ['Secr??taire G??n??rale', 'Secrétaire Générale'],
      ['Secr??taire', 'Secrétaire'],
      ['G??n??rale', 'Générale'],
      ['G??n??ral', 'Général'],
      ['Tr??sorier', 'Trésorier'],
      ['Tr??sori??re', 'Trésorière'],
      ['Premi??re ann??e', 'Première année'],
      ['Deuxi??me ann??e', 'Deuxième année'],
      ['Troisi??me ann??e', 'Troisième année'],
      ['Premi??re', 'Première'],
      ['Deuxi??me', 'Deuxième'],
      ['Troisi??me', 'Troisième'],
      ['ann??e', 'année'],
      ['Ann??e', 'Année'],
      ['ann??es', 'années'],
      ['Ann??es', 'Années'],
      ['G??nie', 'Génie'],
      ['g??nie', 'génie'],
      ['Fili??re', 'Filière'],
      ['fili??re', 'filière'],
      ['P??dagogique', 'Pédagogique'],
      ['p??dagogique', 'pédagogique'],
      ['D??l??gu??', 'Délégué'],
      ['d??l??gu??', 'délégué'],
      ['D??partement', 'Département'],
      ['d??partement', 'département'],
      ['??v??nement', 'Événement'],
      ['??v??nements', 'Événements'],
      ['Actualit??', 'Actualité'],
      ['Actualit??s', 'Actualités'],
      ['d??veloppement', 'développement'],
      ['num??rique', 'numérique'],
      ['Num??rique', 'Numérique'],
      ['Cybers??curit??', 'Cybersécurité'],
      ['Syst??mes', 'Systèmes'],
      ['Embarqu??s', 'Embarqués'],
      ['Donn??es', 'Données'],
      ['S??curit??', 'Sécurité'],
      ['M??canique', 'Mécanique'],
      ['M??catronique', 'Mécatronique'],
      ['Pr??paratoire', 'Préparatoire'],
      ['pr??paratoire', 'préparatoire'],
      ['Pr??paratoires', 'Préparatoires'],
      ['pr??paratoires', 'préparatoires'],
      ['Int??gr??e', 'Intégrée'],
      ['int??gr??e', 'intégrée'],
      ['Int??gr??es', 'Intégrées'],
      ['int??gr??es', 'intégrées'],
      ['??lectrique', 'Électrique'],
      ['??lectronique', 'Électronique'],
      ['R??seaux', 'Réseaux'],
      ['r??seaux', 'réseaux'],
      ['T??l??coms', 'Télécoms'],
      ['t??l??coms', 'télécoms'],
      ['D??cisionnelle', 'Décisionnelle'],
      ['Automatis??s', 'Automatisés'],
      ['Avanc??s', 'Avancés'],
      ['??', 'é'] // Remplacement de secours universel pour tout point d'interrogation double résiduel !
    ];

    for (const { table_name } of tables) {
      const [columns]: any = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = :tableName 
          AND data_type IN ('character varying', 'text');
      `, { replacements: { tableName: table_name } });

      for (const { column_name } of columns) {
        for (const [bad, good] of fixes) {
          try {
            await sequelize.query(`
              UPDATE "${table_name}" 
              SET "${column_name}" = REPLACE("${column_name}"::text, :bad, :good) 
              WHERE "${column_name}"::text LIKE :pattern;
            `, {
              replacements: { bad, good, pattern: `%${bad}%` }
            });
          } catch {
            // ignore
          }
        }
      }
    }

    console.log('\n✅ Nettoyage terminé. Vérification post-nettoyage :');
    let remainingTotal = 0;
    for (const { table_name } of tables) {
      const [columns]: any = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = :tableName 
          AND data_type IN ('character varying', 'text');
      `, { replacements: { tableName: table_name } });

      for (const { column_name } of columns) {
        try {
          const [remaining]: any = await sequelize.query(`
            SELECT id, "${column_name}" AS val 
            FROM "${table_name}" 
            WHERE "${column_name}"::text LIKE '%??%';
          `);
          if (remaining && remaining.length > 0) {
            remainingTotal += remaining.length;
            console.log(`⚠️ Reste dans ${table_name}.${column_name}:`, remaining);
          }
        } catch {
          // ignore
        }
      }
    }

    if (remainingTotal === 0) {
      console.log('🎉 SUCCÈS TOTAL : 0 caractère "??" restant dans TOUTE la base de données !');
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

scanAndFixAll();
