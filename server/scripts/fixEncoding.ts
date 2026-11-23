import 'dotenv/config';
import { sequelize } from '../models';

const cleanFilieres = [
  { abbreviation: 'ISCSI', name: 'Ingénierie des Systèmes Communicants et Sécurité Informatique', description: 'Formation spécialisée dans les systèmes communicants et la sécurité informatique.' },
  { abbreviation: '3IACN', name: 'Ingénierie Informatique, Intelligence Artificielle et Confiance Numérique', description: 'Formation en informatique avec spécialisation en IA et confiance numérique.' },
  { abbreviation: 'ISEIA', name: 'Ingénierie des Systèmes Embarqués et Intelligence Artificielle', description: 'Formation en systèmes embarqués et intelligence artificielle.' },
  { abbreviation: 'ILIA', name: 'Ingénierie Logicielle et Intelligence Artificielle', description: 'Formation en ingénierie logicielle et intelligence artificielle.' },
  { abbreviation: 'GDNC', name: 'Génie du développement numérique et Cybersécurité', description: 'Formation en développement numérique et cybersécurité.' },
  { abbreviation: 'ISDIA', name: 'Ingénierie en Science de Données et Intelligence Artificielle', description: 'Formation en science de données et intelligence artificielle.' },
  { abbreviation: 'INFO', name: 'Génie Informatique', description: 'Formation généraliste en génie informatique.' },
  { abbreviation: 'GM', name: 'Génie Mécanique', description: 'Formation en génie mécanique et systèmes mécaniques.' },
  { abbreviation: 'GMT', name: 'Génie Mécatronique', description: 'Formation en génie mécatronique alliant mécanique, électronique et informatique.' },
  { abbreviation: 'GIND', name: 'Génie Industriel', description: 'Formation en génie industriel et optimisation des processus.' },
  { abbreviation: 'CPI', name: 'Classes Préparatoires Intégrées', description: 'Cycle préparatoire de 2 ans préparant aux études d\'ingénieur.' }
];

async function fixEncoding() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion base de données Neon établie.');

    // 1. Mise à jour propre des filières par abréviation
    for (const f of cleanFilieres) {
      await sequelize.query(
        `UPDATE "filieres" SET "name" = :name, "description" = :desc WHERE "abbreviation" = :abbr;`,
        { replacements: { name: f.name, desc: f.description, abbr: f.abbreviation } }
      );
    }
    console.log('✅ Filières restaurées avec accents parfaits !');

    // 2. Nettoyage textuel global pour toutes les autres tables
    const replacements = [
      ['Secr??taire G??n??rale', 'Secrétaire Générale'],
      ['Secr??taire', 'Secrétaire'],
      ['G??n??rale', 'Générale'],
      ['G??n??ral', 'Général'],
      ['Tr??sorier', 'Trésorier'],
      ['Tr??sori??re', 'Trésorière'],
      ['Premi??re', 'Première'],
      ['Deuxi??me', 'Deuxième'],
      ['Troisi??me', 'Troisième'],
      ['Ann??e', 'Année'],
      ['ann??e', 'année'],
      ['ann??es', 'années'],
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
      ['Cybers??curit??', 'Cybersécurité'],
      ['Syst??mes', 'Systèmes'],
      ['Embarqu??s', 'Embarqués'],
      ['Donn??es', 'Données'],
      ['S??curit??', 'Sécurité'],
      ['M??canique', 'Mécanique'],
      ['M??catronique', 'Mécatronique'],
      ['Pr??paratoire', 'Préparatoire'],
      ['pr??paratoire', 'préparatoire'],
      ['Int??gr??e', 'Intégrée'],
      ['int??gr??e', 'intégrée'],
      ['??lectrique', 'Électrique'],
      ['??lectronique', 'Électronique']
    ];

    const tablesAndColumns = [
      { table: 'adei_members', columns: ['name', 'role'] },
      { table: 'adei_roles', columns: ['name'] },
      { table: 'clubs', columns: ['club', 'president', 'annees_etude', 'description', 'activities', 'achievements'] },
      { table: 'events', columns: ['title', 'description', 'location', 'category'] },
      { table: 'news', columns: ['title', 'content', 'category'] }
    ];

    for (const { table, columns } of tablesAndColumns) {
      for (const col of columns) {
        for (const [bad, good] of replacements) {
          try {
            await sequelize.query(
              `UPDATE "${table}" SET "${col}" = REPLACE("${col}"::text, :bad, :good) WHERE "${col}"::text LIKE :pattern;`,
              {
                replacements: { bad, good, pattern: `%${bad}%` }
              }
            );
          } catch {
            // Ignorer si colonne absente
          }
        }
      }
    }

    console.log('✨ Nettoyage UTF-8 complet terminé avec succès sur Neon !');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur de correction d\'encodage:', error);
    process.exit(1);
  }
}

fixEncoding();
