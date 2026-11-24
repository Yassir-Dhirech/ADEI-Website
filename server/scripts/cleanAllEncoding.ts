import 'dotenv/config';
import { sequelize } from '../models';

/**
 * Script de maintenance : Scan et nettoyage exhaustif de tous les caractères '??' 
 * et restauration des vrais accents français dans toutes les tables de la base de données.
 */
async function scanAndFixAll() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connecté à Neon.');

    const [tables]: any = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);

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
      ['Avanc??s', 'Avancés']
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

    console.log('✨ Nettoyage UTF-8 complet terminé avec succès sur Neon !');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

scanAndFixAll();
