import 'dotenv/config';
import {
  News,
  Event,
  Club,
  Partner,
  ADEIMember,
  AdeiRole,
  Feedback,
  sequelize
} from '../models';

const DEMO_CLUBS = [
  {
    club: 'ENSA Fès Tech & AI Club',
    president: 'Salma Benali',
    annees_etude: '2ème année Cycle Ingénieur (Génie Informatique)',
    tel: '+212 6 61 23 45 01',
    email: 'tech.ai@adei-ensaf.ma',
    website: 'https://ensaf.ac.ma',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    description:
      "Le club référence en intelligence artificielle, développement web full-stack et cloud computing à l'ENSA Fès. Nous formons les étudiants via des bootcamps pratiques et des hackathons nationaux.",
    activities: ['Bootcamp React & TypeScript', 'Ateliers Deep Learning', 'Hackathon 48h', 'Sessions Algorithmique'],
    achievements: ['1er Prix Hackathon National IA 2025', 'Finaliste Moroccan Collegiate Programming Contest'],
    members: 145,
    instagram: 'https://instagram.com',
    linkedin: 'https://linkedin.com',
    facebook: ''
  },
  {
    club: 'Club Robotique & Mécatronique',
    president: 'Youssef El Idrissi',
    annees_etude: '3ème année Cycle Ingénieur (Génie Industriel)',
    tel: '+212 6 61 23 45 02',
    email: 'robotique@adei-ensaf.ma',
    website: 'https://ensaf.ac.ma',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=900&q=80',
    description:
      "Conception de robots autonomes, impression 3D, systèmes embarqués Arduino/STM32 et compétitions nationales de robotique.",
    activities: ['Atelier Arduino & ESP32', 'Conception CAO & Impression 3D', 'Compétition Suiveur de Ligne'],
    achievements: ['Meilleur Design Mécanique — RoboCup Maroc', '2ème Place Compétition Drones Autonomes'],
    members: 92,
    instagram: 'https://instagram.com',
    linkedin: 'https://linkedin.com',
    facebook: ''
  },
  {
    club: 'CyberSec ENSA Fès',
    president: 'Amine Tazi',
    annees_etude: '2ème année Cycle Ingénieur (Cybersécurité)',
    tel: '+212 6 61 23 45 03',
    email: 'cybersec@adei-ensaf.ma',
    website: 'https://ensaf.ac.ma',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=900&q=80',
    description:
      "Initiation à la sécurité offensive et défensive, préparation aux CTF internationaux, audit réseau et sensibilisation à la sécurité applicative.",
    activities: ['CTF Mensuel Interne', 'Labs Pentesting Web', 'Conférences Red Team / Blue Team'],
    achievements: ['Top 5 National Cyber Defense Challenge', 'Organisation du FèsSec CTF (300+ participants)'],
    members: 78,
    instagram: 'https://instagram.com',
    linkedin: 'https://linkedin.com',
    facebook: ''
  },
  {
    club: 'ENACTUS ENSA Fès',
    president: 'Hiba Chraibi',
    annees_etude: '2ème année Cycle Ingénieur',
    tel: '+212 6 61 23 45 04',
    email: 'enactus@adei-ensaf.ma',
    website: 'https://ensaf.ac.ma',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80',
    description:
      "Entrepreneuriat social et innovation durable : nous transformons des idées étudiantes en projets à fort impact communautaire dans la région Fès-Meknès.",
    activities: ['Incubation Projets Sociaux', 'Pitch Coaching', 'Actions Environnementales'],
    achievements: ['Demi-finaliste Enactus Morocco National Cup', '3 startups étudiantes incubées'],
    members: 110,
    instagram: 'https://instagram.com',
    linkedin: 'https://linkedin.com',
    facebook: ''
  },
  {
    club: 'Club Sport & Aventures',
    president: 'Omar Berrada',
    annees_etude: '1ère année Cycle Ingénieur',
    tel: '+212 6 61 23 45 05',
    email: 'sport@adei-ensaf.ma',
    website: '',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80',
    description:
      "Tournois de football, basketball, e-sport, randonnées dans le Moyen Atlas et journées olympiques inter-filières.",
    activities: ['Ligue Football ENSAF', 'Randonnée Ifrane & Azrou', 'Tournoi Basket 3x3'],
    achievements: ['Champions Tournoi Inter-ENSA 2025', 'Plus de 250 participants par édition'],
    members: 160,
    instagram: 'https://instagram.com',
    linkedin: '',
    facebook: ''
  },
  {
    club: 'Club Arts, Médias & Cinéma',
    president: 'Kenza Fassi',
    annees_etude: '2ème année Cycle Préparatoire',
    tel: '+212 6 61 23 45 06',
    email: 'media@adei-ensaf.ma',
    website: '',
    image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80',
    description:
      "Couverture photo/vidéo des grands événements du campus, ateliers design graphique, montage cinéma et soirées musicales.",
    activities: ['Atelier Photographie & Montage', 'Soirée Ciné-Débat', 'Podcast Étudiant ENSAF'],
    achievements: ['Couverture officielle du Forum ENSA-Entreprises', 'Prix du Meilleur Court-Métrage Étudiant'],
    members: 64,
    instagram: 'https://instagram.com',
    linkedin: '',
    facebook: ''
  }
];

const DEMO_NEWS = [
  {
    title: "Ouverture des inscriptions au Forum ENSA Fès – Entreprises 2026",
    category: 'Carrière',
    date: '2026-11-15',
    organizer: 'ADEI ENSA Fès',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    link: 'https://ensaf.ac.ma',
    order_display: 1,
    content:
      "L'édition 2026 du Forum ENSA Fès – Entreprises ouvre officiellement ses portes ! Plus de 40 entreprises partenaires des secteurs Tech, Industrie, Finance et Conseil seront présentes sur le campus pour rencontrer nos élèves-ingénieurs.\n\nAu programme : entretiens de stages PFE/PFA, conférences métiers, ateliers correction de CV et tables rondes avec les lauréats de l'ENSA Fès. Pensez à préparer votre portfolio avant le jour J !"
  },
  {
    title: "Victoire de l'équipe ENSA Fès au Hackathon National IA & Cloud",
    category: 'Compétition',
    date: '2026-11-10',
    organizer: 'ENSA Fès Tech & AI Club',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    link: null,
    order_display: 2,
    content:
      "Félicitations à nos quatre élèves-ingénieurs qui ont remporté la première place du Hackathon National IA & Cloud après 48 heures de développement intense.\n\nLeur solution d'optimisation énergétique intelligente pour les bâtiments universitaires a séduit le jury par sa précision technique et sa scalabilité."
  },
  {
    title: "Lancement du nouveau portail numérique de l'ADEI ENSA Fès",
    category: 'Campus',
    date: '2026-11-06',
    organizer: 'Pôle IT — ADEI',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
    link: null,
    order_display: 3,
    content:
      "L'ADEI dévoile sa nouvelle plateforme étudiante entièrement repensée : agenda unifié des événements, annuaire des clubs, ressources académiques par filière et Boîte à Idées interactive.\n\nN'hésitez pas à partager vos suggestions d'amélioration directement depuis la rubrique Boîte à Idées !"
  },
  {
    title: "Campagne de recrutement des clubs étudiants — Semestre d'Automne",
    category: 'Vie Étudiante',
    date: '2026-10-28',
    organizer: 'ADEI ENSA Fès',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    link: null,
    order_display: 4,
    content:
      "Vous êtes en cycle préparatoire ou en cycle ingénieur ? C'est le moment idéal pour rejoindre l'un des clubs actifs de l'ENSA Fès : IA, Robotique, Cybersécurité, Enactus, Sport ou Médias.\n\nDes stands de présentation seront installés dans l'esplanade centrale toute la semaine de 10h à 16h."
  },
  {
    title: "Nouvelle convention de partenariat avec Technopark Fès",
    category: 'Partenariat',
    date: '2026-10-20',
    organizer: 'Bureau Exécutif ADEI',
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80',
    link: 'https://technopark.ma',
    order_display: 5,
    content:
      "Un accord stratégique vient d'être signé pour offrir aux étudiants porteurs de projets un accès privilégié à des sessions de mentorat, des espaces de coworking et des ateliers de création de startups."
  },
  {
    title: "Mise à jour des Drives pédagogiques pour toutes les filières",
    category: 'Académique',
    date: '2026-10-12',
    organizer: 'Cellule Académique ADEI',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80',
    link: null,
    order_display: 6,
    content:
      "Tous les cours, travaux dirigés, comptes-rendus de TP et anciens examens ont été réorganisés par semestre et par filière dans la section ENSA Fès du site."
  }
];

const DEMO_EVENTS = [
  {
    title: 'Hackathon ENSA Fès 2026 — Build for Future',
    description:
      "48 heures de code, de design et d'innovation en équipe autour de 3 défis : IA générative, Smart Campus et FinTech. Repas, mentorat par des ingénieurs seniors et 30 000 DH de prix à la clé !",
    date: '2026-12-05',
    time: '09:00',
    location: 'Grand Amphithéâtre & Hall Innovation',
    category: 'Tech',
    organizer: 'ADEI & Tech AI Club',
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
    link: 'https://ensaf.ac.ma',
    order_display: 1
  },
  {
    title: 'Forum ENSA Fès – Entreprises (14ème Édition)',
    description:
      "Rencontrez les recruteurs de plus de 40 entreprises leaders au Maroc et à l'international. Stands recrutement PFE/PFA, conférences plénières et ateliers networking.",
    date: '2026-12-12',
    time: '09:30',
    location: 'Esplanade & Amphi A — ENSA Fès',
    category: 'Carrière',
    organizer: 'ADEI ENSA Fès',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    link: 'https://ensaf.ac.ma',
    order_display: 2
  },
  {
    title: 'Workshop Pratique : Docker, Kubernetes & Déploiement Cloud',
    description:
      "Atelier hands-on animé par des anciens lauréats DevOps. Apportez votre PC pour conteneuriser une application full-stack et la déployer en production.",
    date: '2026-11-28',
    time: '14:30',
    location: 'Salle Conférences B2',
    category: 'Workshop',
    organizer: 'CyberSec & Tech Club',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    link: null,
    order_display: 3
  },
  {
    title: "Gala & Nuit de l'Ingénieur ENSAF",
    description:
      "La grande soirée culturelle annuelle de l'école : remise des trophées aux clubs les plus actifs, concerts acoustiques, stand-up étudiant et dîner de gala.",
    date: '2026-12-20',
    time: '19:00',
    location: 'Palais des Congrès — Fès',
    category: 'Culture',
    organizer: 'ADEI ENSA Fès',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    link: null,
    order_display: 4
  },
  {
    title: 'Tournoi Inter-Filières de Football & Basket',
    description:
      "Affrontement amical entre toutes les promotions (CP1, CP2 et filières du cycle ingénieur). Inscrivez votre équipe auprès du Club Sport avant mercredi !",
    date: '2026-11-24',
    time: '15:00',
    location: 'Terrains Sportifs ENSA Fès',
    category: 'Sport',
    organizer: 'Club Sport & Aventures',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    link: null,
    order_display: 5
  }
];

const DEMO_PARTNERS = [
  {
    name: 'Capgemini Engineering Maroc',
    description: 'Partenaire technologique officiel pour les stages PFE, ateliers cloud et parrainage du Forum Entreprises.',
    website: 'https://www.capgemini.com',
    logo: '/images/ADEI.png',
    isActive: true,
    order_display: 1
  },
  {
    name: 'OCP Digital Solutions',
    description: "Partenaire innovation industrielle, data science et transformation digitale auprès des élèves-ingénieurs.",
    website: 'https://www.ocpgroup.ma',
    logo: '/images/ADEI.png',
    isActive: true,
    order_display: 2
  },
  {
    name: 'Technopark Fès',
    description: "Accompagnement à l'entrepreneuriat étudiant, mentorat startups et accès aux espaces d'incubation.",
    website: 'https://www.technopark.ma',
    logo: '/images/ADEI.png',
    isActive: true,
    order_display: 3
  },
  {
    name: 'USMBA — Université Sidi Mohamed Ben Abdellah',
    description: "Tutelle académique et soutien institutionnel aux activités scientifiques, culturelles et sportives de l'ENSA Fès.",
    website: 'https://www.usmba.ac.ma',
    logo: '/images/ADEI.png',
    isActive: true,
    order_display: 4
  }
];

const DEMO_MEMBERS = [
  // Bureau Exécutif 2025/2026 (Mandat Actuel)
  { name: 'Mehdi El Alami', role: 'President', mandate: '2025/2026', email: 'president@adei-ensaf.ma', photo: '' },
  { name: 'Nour El Houda Mansouri', role: 'Vice President', mandate: '2025/2026', email: 'vp@adei-ensaf.ma', photo: '' },
  { name: 'Sara Benjelloun', role: 'Secrétaire Générale', mandate: '2025/2026', email: 'sg@adei-ensaf.ma', photo: '' },
  { name: 'Hamza Kettani', role: 'Trésorier', mandate: '2025/2026', email: 'tresorier@adei-ensaf.ma', photo: '' },
  { name: 'Yasser Dahmani', role: 'IT Manager', mandate: '2025/2026', email: 'it@adei-ensaf.ma', photo: '' },
  { name: 'Ines Lahlou', role: 'Responsable Media', mandate: '2025/2026', email: 'media.adei@adei-ensaf.ma', photo: '' },
  { name: 'Ayoub Sefrioui', role: 'Responsables Sponsoring', mandate: '2025/2026', email: 'sponsoring@adei-ensaf.ma', photo: '' },
  { name: 'Lina Berrada', role: 'Responsables Création & Design', mandate: '2025/2026', email: 'design@adei-ensaf.ma', photo: '' },
  // Bureau Exécutif 2024/2025 (Ancien Mandat)
  { name: 'Karim Bennani', role: 'President', mandate: '2024/2025', email: 'president.2425@adei-ensaf.ma', photo: '' },
  { name: 'Salma El Fassi', role: 'Vice President', mandate: '2024/2025', email: 'vp.2425@adei-ensaf.ma', photo: '' },
  { name: 'Oussama Tazi', role: 'Secrétaire Générale', mandate: '2024/2025', email: 'sg.2425@adei-ensaf.ma', photo: '' },
  { name: 'Chaimae Idrissi', role: 'Trésorier', mandate: '2024/2025', email: 'tresorier.2425@adei-ensaf.ma', photo: '' },
  { name: 'Anas Belkacem', role: 'IT Manager', mandate: '2024/2025', email: 'it.2425@adei-ensaf.ma', photo: '' },
  { name: 'Zineb Alaoui', role: 'Responsable Media', mandate: '2024/2025', email: 'media.2425@adei-ensaf.ma', photo: '' },
  // Bureau Exécutif 2023/2024 (Archive)
  { name: 'Reda Benkirane', role: 'President', mandate: '2023/2024', email: 'president.2324@adei-ensaf.ma', photo: '' },
  { name: 'Meryem Choukri', role: 'Vice President', mandate: '2023/2024', email: 'vp.2324@adei-ensaf.ma', photo: '' },
  { name: 'Walid Rachidi', role: 'Secrétaire Générale', mandate: '2023/2024', email: 'sg.2324@adei-ensaf.ma', photo: '' },
  { name: 'Yasmine Sqalli', role: 'Trésorier', mandate: '2023/2024', email: 'tresorier.2324@adei-ensaf.ma', photo: '' }
];

const DEMO_FEEDBACKS = [
  {
    name: 'Othmane K.',
    email: 'othmane.k@usmba.ac.ma',
    type: 'avis' as const,
    message:
      "Le nouveau portail ADEI est super fluide ! Pouvoir retrouver tous les liens Drive par filière et l'agenda des événements au même endroit fait gagner énormément de temps.",
    isPublished: true,
    read: true
  },
  {
    name: 'Meryem B.',
    email: 'meryem.b@usmba.ac.ma',
    type: 'recommandation' as const,
    message:
      "Ce serait génial d'organiser une session de préparation aux entretiens techniques (System Design & Algorithms) juste avant le Forum Entreprises de décembre !",
    isPublished: true,
    read: true
  },
  {
    name: 'Saad E.',
    email: 'saad.e@usmba.ac.ma',
    type: 'recommandation' as const,
    message:
      "Pourquoi ne pas ajouter une nocturne bibliothèque / coworking pendant la semaine précédant les examens finaux avec du café offert par l'ADEI ?",
    isPublished: true,
    read: true
  },
  {
    name: 'Rim A.',
    email: 'rim.a@usmba.ac.ma',
    type: 'avis' as const,
    message:
      "Message en attente de modération : bravo à toute l'équipe d'organisation du Hackathon, hâte de participer cette année !",
    isPublished: false,
    read: false
  },
  {
    name: 'Taha M.',
    email: 'taha.m@usmba.ac.ma',
    type: 'autre' as const,
    message:
      "Message en attente de modération : est-il possible de réserver la salle de robotique le samedi matin pour les projets de fin d'année ?",
    isPublished: false,
    read: false
  }
];

async function clearDemo() {
  console.log('🧹 Suppression des données de démonstration...');
  await News.destroy({ where: { title: DEMO_NEWS.map((n) => n.title) } });
  await Event.destroy({ where: { title: DEMO_EVENTS.map((e) => e.title) } });
  await Club.destroy({ where: { email: DEMO_CLUBS.map((c) => c.email) } });
  await Partner.destroy({ where: { name: DEMO_PARTNERS.map((p) => p.name) } });
  await ADEIMember.destroy({ where: { email: DEMO_MEMBERS.map((m) => m.email) } });
  await Feedback.destroy({ where: { email: DEMO_FEEDBACKS.map((f) => f.email) } });
  console.log('✅ Données de démonstration supprimées (utilisateurs, filières et rôles préservés).');
}

async function seedDemo() {
  console.log('🌱 Injection des données de démonstration ADEI ENSA Fès...');

  for (const club of DEMO_CLUBS) {
    await Club.findOrCreate({ where: { email: club.email }, defaults: club });
  }
  for (const news of DEMO_NEWS) {
    await News.findOrCreate({ where: { title: news.title }, defaults: news });
  }
  for (const ev of DEMO_EVENTS) {
    await Event.findOrCreate({ where: { title: ev.title }, defaults: ev });
  }
  for (const partner of DEMO_PARTNERS) {
    await Partner.findOrCreate({ where: { name: partner.name }, defaults: partner });
  }

  const roles = await AdeiRole.findAll();
  const roleByName = new Map(roles.map((r) => [r.name, r.id]));

  for (const member of DEMO_MEMBERS) {
    await ADEIMember.findOrCreate({
      where: { email: member.email },
      defaults: { ...member, roleId: roleByName.get(member.role) ?? null }
    });
  }

  for (const fb of DEMO_FEEDBACKS) {
    await Feedback.findOrCreate({ where: { email: fb.email, message: fb.message }, defaults: fb });
  }

  console.log(
    `✅ Démo prête : ${DEMO_NEWS.length} actualités, ${DEMO_EVENTS.length} événements, ${DEMO_CLUBS.length} clubs, ${DEMO_MEMBERS.length} membres ADEI, ${DEMO_PARTNERS.length} partenaires, ${DEMO_FEEDBACKS.length} feedbacks (3 publiés + 2 en attente).`
  );
}

async function main() {
  try {
    await sequelize.authenticate();
    if (process.argv.includes('--clear')) {
      await clearDemo();
    } else {
      await seedDemo();
    }
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur seedDemo:', err);
    await sequelize.close();
    process.exit(1);
  }
}

void main();
