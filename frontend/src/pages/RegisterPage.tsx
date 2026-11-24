import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  GraduationCap,
  Layers,
  ShieldCheck,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  Crown,
  Megaphone,
  Briefcase,
  Building2,
  KeyRound,
  Send,
  Check,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { ClubItem } from '@/types/api';

// 1. Définition des Rôles avec cartes visuelles
const ROLES = [
  {
    id: 'user',
    label: 'Étudiant standard',
    badge: 'Étudiant',
    desc: 'Accès cours, drives & billetterie',
    icon: GraduationCap
  },
  {
    id: 'president',
    label: 'Président de Club',
    badge: 'Président',
    desc: 'Gestion du club & événements',
    icon: Crown
  },
  {
    id: 'delegue',
    label: 'Délégué de Classe',
    badge: 'Délégué',
    desc: 'Représentant pédagogique',
    icon: Megaphone
  },
  {
    id: 'alumni',
    label: 'Lauréat (Alumni)',
    badge: 'Alumni',
    desc: 'Diplômé ENSA & réseau',
    icon: Briefcase
  }
] as const;

type RoleType = (typeof ROLES)[number]['id'];

// 2. Années d'études ENSA Fès (5 ans)
const ANNEES_ETUDES = [
  { id: 'CP1', label: 'CP1 (1ère Année Classes Préparatoires)', isCp: true },
  { id: 'CP2', label: 'CP2 (2ème Année Classes Préparatoires)', isCp: true },
  { id: 'CI1', label: 'CI1 (1ère Année Cycle Ingénieur)', isCp: false },
  { id: 'CI2', label: 'CI2 (2ème Année Cycle Ingénieur)', isCp: false },
  { id: 'CI3', label: 'CI3 (3ème Année Cycle Ingénieur / PFE)', isCp: false }
];

// 3. Sections pour les CP
const CP_SECTIONS = ['Section A', 'Section B', 'Section C'];

// 4. Filières officielles du Cycle Ingénieur ENSA Fès
const ING_FILIERES = [
  'Génie Informatique (INFO)',
  'Génie du Développement Numérique et Cybersécurité (GDNC)',
  'Ingénierie des Systèmes Intelligents et Décisionnels (ISDIA)',
  'Génie Industriel (GI)',
  'Génie Mécanique et Systèmes Automatisés (GMSA)',
  'Génie des Systèmes Embarqués et Télécommunications (GSET)',
  'Génie Énergétique et Systèmes Intelligents (GESI)',
  'Génie Civil (GC)'
];

// 5. Promotions pour les Alumni
const PROMOS = [
  'Promo 2025',
  'Promo 2024',
  'Promo 2023',
  'Promo 2022',
  'Promo 2021',
  'Promo 2020',
  'Promo 2019 ou avant'
];

// Clubs par défaut
const DEFAULT_CLUBS = [
  'CIT (Club Informatique et Télécom)',
  'Club Enactus ENSA Fès',
  'Club IEEE Student Branch',
  'Club Robotique & Mécatronique',
  'Club Génie Civil (CGC)',
  'Club Design & Arts',
  'Club Musique',
  'Club Sportif ADEI',
  'Autre Club'
];

// Variantes d'animation fluide et directionnelle entre étapes
const stepVariants: Variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 32 : -32,
    opacity: 0,
    filter: 'blur(3px)'
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.32,
      ease: 'easeOut'
    }
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -32 : 32,
    opacity: 0,
    filter: 'blur(3px)',
    transition: {
      duration: 0.22,
      ease: 'easeIn'
    }
  })
};

export function RegisterPage() {
  const navigate = useNavigate();

  // Étape active (1 -> 2 -> 3) et direction d'animation (1 = suivant, -1 = retour)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState<1 | -1>(1);

  const goToStep = (next: 1 | 2 | 3) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  // Chargement des clubs
  const { data: clubsData } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => apiRequest<ClubItem[]>('/clubs'),
    staleTime: 5 * 60 * 1000
  });

  const availableClubs =
    clubsData && clubsData.data && clubsData.data.length > 0
      ? clubsData.data.map((c) => c.club)
      : DEFAULT_CLUBS;

  // --- ÉTAPE 1 : Coordonnées (Nom et Prénom distincts) & Mot de passe ---
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Nom complet reconstitué pour la base de données et l'affichage
  const fullName = `${prenom.trim()} ${nom.trim().toUpperCase()}`.trim();

  // --- ÉTAPE 2 : Profil Académique ---
  const [role, setRole] = useState<RoleType>('user');
  const [annee, setAnnee] = useState(ANNEES_ETUDES[0].id);
  const [cpSection, setCpSection] = useState(CP_SECTIONS[0]);
  const [ingFiliere, setIngFiliere] = useState(ING_FILIERES[0]);
  const [selectedClub, setSelectedClub] = useState(availableClubs[0]);
  const [alumniFiliere, setAlumniFiliere] = useState(ING_FILIERES[0]);
  const [promo, setPromo] = useState(PROMOS[1]);
  const [company, setCompany] = useState('');

  // --- ÉTAPE 3 : Vérification OTP ---
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const isCurrentAnneeCp = annee === 'CP1' || annee === 'CP2';

  // Gestion du compte à rebours de l'OTP
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Règles de sécurité mot de passe
  const passwordRules = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    matches: password.length > 0 && password === confirmPassword
  };

  const isPasswordValid =
    passwordRules.minLength &&
    passwordRules.hasUpper &&
    passwordRules.hasNumber &&
    passwordRules.matches;

  // Validation passage Étape 1 -> Étape 2
  const handleNextStep1 = () => {
    setError('');
    if (!nom.trim() || nom.trim().length < 2) {
      setError('Veuillez renseigner votre nom de famille (au moins 2 caractères).');
      return;
    }
    if (!prenom.trim() || prenom.trim().length < 2) {
      setError('Veuillez renseigner votre prénom (au moins 2 caractères).');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Veuillez renseigner une adresse email valide.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setError('Veuillez renseigner un numéro de téléphone valide (au moins 8 chiffres).');
      return;
    }
    if (!isPasswordValid) {
      setError('Veuillez définir un mot de passe conforme à tous les critères de sécurité.');
      return;
    }
    goToStep(2);
  };

  // Validation passage Étape 2 -> Étape 3
  const handleNextStep2 = () => {
    setError('');
    goToStep(3);
    if (!otpSent) {
      void handleSendOtp();
    }
  };

  // Envoi de l'OTP par email
  const handleSendOtp = async () => {
    if (otpTimer > 0) return;
    setOtpLoading(true);
    setError('');
    try {
      const res = await apiRequest<{ devOtp?: string }>('/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() })
      });
      setOtpSent(true);
      setOtpTimer(60);
      toast.success('Code envoyé ! Vérifiez votre boîte de réception ou vos spams.');
      if (res.data?.devOtp) {
        setDevOtpHint(res.data.devOtp);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'envoi du code OTP";
      setError(msg);
      toast.error(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  // Soumission finale
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp.trim() || otp.trim().length < 4) {
      setError('Veuillez saisir le code de vérification reçu par email.');
      toast.error('Code OTP requis');
      return;
    }

    let resolvedFiliere = '';
    let resolvedClasse = '';

    if (role === 'alumni') {
      resolvedFiliere = alumniFiliere;
      resolvedClasse = company.trim() ? `${promo} · ${company.trim()}` : promo;
    } else {
      if (isCurrentAnneeCp) {
        resolvedFiliere = 'Cycle Préparatoire';
        resolvedClasse = `${annee} - ${cpSection}`;
      } else {
        resolvedFiliere = ingFiliere;
        resolvedClasse = annee;
      }

      if (role === 'president') {
        resolvedClasse += ` (${selectedClub})`;
      }
    }

    setLoading(true);
    try {
      await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify({
          username: fullName,
          email: email.trim(),
          phone: phone.trim(),
          filiere: resolvedFiliere,
          classe: resolvedClasse,
          requested_role: role,
          password,
          otp: otp.trim()
        })
      });

      setIsSuccess(true);
      toast.success('Compte créé avec succès !');
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'inscription";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="relative mx-auto flex min-h-[calc(100vh-11rem)] max-w-2xl items-center justify-center py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full rounded-3xl border border-zinc-200/80 bg-white p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12 dark:border-zinc-800 dark:bg-zinc-900/90"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-inner">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold sm:text-3xl">Email vérifié &amp; Demande reçue !</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Merci <strong>{fullName}</strong>. Votre adresse <strong>{email}</strong> a été validée avec succès.
          </p>
          <div className="my-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-medium text-amber-700 dark:text-amber-300">
            <strong>Validation finale par l&apos;ADEI :</strong> Votre compte est enregistré avec le statut « En attente ». L&apos;équipe administrative de l&apos;ADEI activera votre accès dès validation de votre inscription.
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={() => navigate('/login')}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Aller vers la connexion <ArrowRight className="h-4 w-4" />
            </Button>
            <a
              href={`https://wa.me/212629549292?text=Bonjour%20ADEI,%20je%20viens%20de%20valider%20mon%20inscription%20(${encodeURIComponent(fullName)}%20-%20${encodeURIComponent(email)}),%20pouvez-vous%20activer%20mon%20compte%20?`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              <MessageCircle className="h-4 w-4" /> Prévenir l&apos;ADEI sur WhatsApp
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-11rem)] max-w-5xl items-center justify-center py-6">
      {/* Ambient glowing orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-12 top-8 h-64 w-64 rounded-full bg-red-600/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 bottom-8 h-64 w-64 rounded-full bg-rose-500/15 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative grid w-full overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-2xl md:grid-cols-12 dark:border-zinc-800/80 dark:bg-zinc-900/95"
      >
        {/* Left Cinematic Panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-white md:col-span-5 md:flex">
          <img
            src="/images/hero-login.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/90 via-zinc-950/80 to-black/95" />

          <div className="relative z-10 flex items-center gap-3">
            <img
              src="/images/ADEI.png"
              alt="ADEI ENSA Fès"
              className="h-11 w-11 rounded-2xl border border-white/15 bg-white/10 p-1.5 object-contain backdrop-blur"
            />
            <div>
              <p className="text-sm font-bold tracking-wide text-white">ADEI ENSA FÈS</p>
              <p className="text-xs text-red-200/80">Portail Officiel ENSA Fès</p>
            </div>
          </div>

          <div className="relative z-10 my-8 space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-200">
              <Sparkles className="h-3.5 w-3.5" /> Inscription Sécurisée par OTP
            </span>
            <h2 className="text-2xl font-extrabold leading-tight tracking-tight lg:text-3xl">
              Votre passeport pour toute la vie universitaire ensaïste.
            </h2>
            <ul className="space-y-2.5 text-xs leading-relaxed text-zinc-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-red-400" />
                Vérification d&apos;identité par email sécurisé
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-red-400" />
                Accès direct au Drive de votre classe &amp; cours
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-red-400" />
                Réseau d&apos;ingénieurs et des lauréats ENSA
              </li>
            </ul>
          </div>

          <div className="relative z-10 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <p className="text-xs font-semibold text-white">Vous avez déjà un compte ?</p>
            <p className="mt-1 text-[11px] text-zinc-300">
              Connectez-vous pour retrouver vos favoris et vos configurations.
            </p>
            <Link
              to="/login"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-red-300 hover:text-white hover:underline"
            >
              Se connecter maintenant <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Form Panel (Multi-Step Stepper) */}
        <div className="flex flex-col justify-center p-6 sm:p-8 md:col-span-7">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight">Créer un compte</h1>
            <p className="text-xs text-zinc-500">
              Inscription en 3 étapes avec confirmation par code OTP.
            </p>
          </div>

          {/* STEPPER PROGRESSION INTERACTIF ET LUXUEUX */}
          <div className="mt-5 space-y-2.5">
            <div className="grid grid-cols-3 gap-2">
              {[
                { num: 1, title: 'Identifiants', desc: 'Coordonnées & Sécurité' },
                { num: 2, title: 'Profil ENSA', desc: 'Rôle & Filière' },
                { num: 3, title: 'Validation', desc: 'Vérification OTP' }
              ].map((s) => {
                const isActive = step === s.num;
                const isPassed = step > s.num;
                return (
                  <motion.button
                    key={s.num}
                    type="button"
                    disabled={s.num > step}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => goToStep(s.num as 1 | 2 | 3)}
                    className={`relative flex flex-col rounded-2xl border p-2.5 text-left transition-all ${isActive
                      ? 'border-red-600 bg-red-500/10 shadow-sm ring-1 ring-red-500/30 dark:bg-red-500/15'
                      : isPassed
                        ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500'
                        : 'border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-800 dark:bg-zinc-950'
                      }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${isPassed
                          ? 'bg-emerald-600 text-white'
                          : isActive
                            ? 'bg-red-600 text-white'
                            : 'bg-zinc-300 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                          }`}
                      >
                        {isPassed ? <Check className="h-2.5 w-2.5" /> : s.num}
                      </span>
                      <span
                        className={`text-xs font-bold ${isActive ? 'text-red-600 dark:text-red-400' : isPassed ? 'text-emerald-600' : 'text-zinc-500'
                          }`}
                      >
                        {s.title}
                      </span>
                    </div>
                    <span className="mt-1 line-clamp-1 text-[10px] text-zinc-400">
                      {s.desc}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Barre de progression fluide */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <motion.div
                className="h-full bg-gradient-to-r from-red-600 to-rose-500"
                initial={false}
                animate={{ width: step === 1 ? '33.3%' : step === 2 ? '66.6%' : '100%' }}
                transition={{ type: 'spring', stiffness: 240, damping: 25 }}
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3.5 rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs font-medium text-red-600 dark:text-red-400"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
            <AnimatePresence mode="wait" custom={direction}>
              {/* ========================================================
                  ÉTAPE 1 : IDENTIFIANTS + MOT DE PASSE (Champs Nom & Prénom distincts)
                  ======================================================== */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-3"
                >
                  {/* Ligne 1 : Nom et Prénom distincts */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-nom">Nom de famille *</Label>
                      <div className="relative">
                        <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                          id="reg-nom"
                          required
                          placeholder="ex: El Amrani"
                          value={nom}
                          onChange={(e) => setNom(e.target.value)}
                          className="h-9 rounded-xl pl-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-prenom">Prénom *</Label>
                      <div className="relative">
                        <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                          id="reg-prenom"
                          required
                          placeholder="ex: Youssef"
                          value={prenom}
                          onChange={(e) => setPrenom(e.target.value)}
                          className="h-9 rounded-xl pl-9 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ligne 2 : Email et Téléphone */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-email">Adresse Email *</Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                          id="reg-email"
                          type="email"
                          required
                          placeholder="nom@usmba.ac.ma ou gmail"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-9 rounded-xl pl-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-phone">Numéro WhatsApp / Téléphone *</Label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                          id="reg-phone"
                          required
                          placeholder="ex: 0612345678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-9 rounded-xl pl-9 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* MOT DE PASSE + CONFIRMATION */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-pwd">Mot de passe *</Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                          id="reg-pwd"
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-9 rounded-xl pl-9 pr-9 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-conf-pwd">Confirmer mot de passe *</Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                          id="reg-conf-pwd"
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-9 rounded-xl pl-9 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Checklist Sécurité */}
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-50 p-2.5 text-[10px] dark:bg-zinc-950">
                    <div className={`flex items-center gap-1.5 ${passwordRules.minLength ? 'text-emerald-600' : 'text-zinc-400'}`}>
                      {passwordRules.minLength ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>8 car. minimum</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordRules.hasUpper ? 'text-emerald-600' : 'text-zinc-400'}`}>
                      {passwordRules.hasUpper ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>1 majuscule</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordRules.hasNumber ? 'text-emerald-600' : 'text-zinc-400'}`}>
                      {passwordRules.hasNumber ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>1 chiffre</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordRules.matches ? 'text-emerald-600' : 'text-zinc-400'}`}>
                      {passwordRules.matches ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>Mots de passe identiques</span>
                    </div>
                  </div>

                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      onClick={handleNextStep1}
                      className="mt-3 h-10 w-full rounded-xl bg-red-600 text-xs font-semibold text-white shadow-lg shadow-red-600/20 hover:bg-red-700"
                    >
                      Continuer vers le profil académique <ArrowRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {/* ========================================================
                  ÉTAPE 2 : PROFIL ACADÉMIQUE & STATUT
                  ======================================================== */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-3.5"
                >
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Statut à l&apos;ENSA Fès *
                    </Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {ROLES.map((r) => {
                        const Icon = r.icon;
                        const isSelected = role === r.id;
                        return (
                          <motion.button
                            key={r.id}
                            type="button"
                            whileHover={{ y: -2, scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            onClick={() => setRole(r.id)}
                            className={`relative flex flex-col items-center justify-center rounded-2xl border p-2.5 text-center transition-all ${isSelected
                              ? 'border-red-600 bg-red-500/10 shadow-sm ring-1 ring-red-500/30 dark:bg-red-500/15'
                              : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950'
                              }`}
                          >
                            <Icon
                              className={`h-4 w-4 ${isSelected ? 'text-red-600 dark:text-red-400' : 'text-zinc-500'
                                }`}
                            />
                            <span
                              className={`mt-1 text-xs font-bold ${isSelected ? 'text-red-600 dark:text-red-400' : 'text-zinc-800 dark:text-zinc-200'
                                }`}
                            >
                              {r.badge}
                            </span>
                            <span className="mt-0.5 line-clamp-1 text-[9px] text-zinc-400">
                              {r.desc}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {role !== 'alumni' ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {/* Dropdown 1 : Année d'étude */}
                        <div className="space-y-1.5">
                          <Label htmlFor="reg-annee" className="flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5 text-zinc-400" /> Année d&apos;étude *
                          </Label>
                          <select
                            id="reg-annee"
                            value={annee}
                            onChange={(e) => setAnnee(e.target.value)}
                            className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium outline-none focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-950"
                          >
                            {ANNEES_ETUDES.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Dropdown 2 : Section (si CP) OU Filière (si CI) */}
                        <div className="space-y-1.5">
                          <Label htmlFor="reg-subdivision" className="flex items-center gap-1">
                            <GraduationCap className="h-3.5 w-3.5 text-zinc-400" />
                            {isCurrentAnneeCp ? 'Section Préparatoire *' : 'Filière d’Ingénierie *'}
                          </Label>
                          {isCurrentAnneeCp ? (
                            <select
                              id="reg-subdivision"
                              value={cpSection}
                              onChange={(e) => setCpSection(e.target.value)}
                              className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium outline-none focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-950"
                            >
                              {CP_SECTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <select
                              id="reg-subdivision"
                              value={ingFiliere}
                              onChange={(e) => setIngFiliere(e.target.value)}
                              className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium outline-none focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-950"
                            >
                              {ING_FILIERES.map((f) => (
                                <option key={f} value={f}>
                                  {f}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {role === 'president' && (
                        <div className="space-y-1.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3">
                          <Label htmlFor="reg-club" className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                            <Crown className="h-3.5 w-3.5 text-amber-500" /> Club présidé *
                          </Label>
                          <select
                            id="reg-club"
                            value={selectedClub}
                            onChange={(e) => setSelectedClub(e.target.value)}
                            className="h-9 w-full rounded-xl border border-amber-500/40 bg-white px-3 text-xs font-medium outline-none focus:border-amber-500 dark:border-amber-900 dark:bg-zinc-950"
                          >
                            {availableClubs.map((club) => (
                              <option key={club} value={club}>
                                {club}
                              </option>
                            ))}
                          </select>
                          <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80">
                            Un accord de l&apos;ADEI sera requis pour valider votre mandat de président.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Profil Lauréat */
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1.5 sm:col-span-1">
                        <Label htmlFor="reg-alumni-promo">Promotion *</Label>
                        <select
                          id="reg-alumni-promo"
                          value={promo}
                          onChange={(e) => setPromo(e.target.value)}
                          className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs outline-none focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-950"
                        >
                          {PROMOS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="reg-alumni-filiere">Filière de diplôme *</Label>
                        <select
                          id="reg-alumni-filiere"
                          value={alumniFiliere}
                          onChange={(e) => setAlumniFiliere(e.target.value)}
                          className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs outline-none focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-950"
                        >
                          {ING_FILIERES.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5 sm:col-span-3">
                        <Label htmlFor="reg-company" className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-zinc-400" /> Entreprise / Poste actuel (Optionnel)
                        </Label>
                        <Input
                          id="reg-company"
                          placeholder="ex: Capgemini, OCP, Fondateur Startup, Ingénieur IA..."
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          className="h-9 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Boutons de navigation (Retour Étape 1 + Continuer vers Étape 3) */}
                  <div className="flex gap-2.5 pt-2">
                    <motion.div className="w-1/3" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => goToStep(1)}
                        className="h-10 w-full rounded-xl border-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        <ArrowLeft className="h-4 w-4" /> Retour
                      </Button>
                    </motion.div>
                    <motion.div className="w-2/3" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="button"
                        onClick={handleNextStep2}
                        className="h-10 w-full rounded-xl bg-red-600 text-xs font-semibold text-white shadow-lg shadow-red-600/20 hover:bg-red-700"
                      >
                        Continuer vers Sécurité &amp; OTP <ArrowRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* ========================================================
                  ÉTAPE 3 : VÉRIFICATION OTP EMAIL & VALIDATION
                  ======================================================== */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-4"
                >
                  {/* Récapitulatif visuel du profil */}
                  <div className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3 text-xs backdrop-blur dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 font-bold text-white">
                        {`${(prenom[0] || '').toUpperCase()}${(nom[0] || '').toUpperCase()}`}
                      </div>
                      <div>
                        <p className="font-bold">{fullName || 'Étudiant'}</p>
                        <p className="text-[11px] text-zinc-500">{email}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-600 dark:text-red-400">
                      {ROLES.find((r) => r.id === role)?.badge}
                    </span>
                  </div>

                  {/* CARTE OTP EMAIL */}
                  <div className="space-y-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="reg-otp" className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400">
                        <KeyRound className="h-4 w-4" /> Code de vérification Email (OTP) *
                      </Label>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpLoading || otpTimer > 0}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                      >
                        {otpLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        {otpTimer > 0 ? `Renvoyer (${otpTimer}s)` : 'Renvoyer un code'}
                      </button>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs leading-relaxed text-zinc-500">
                        Un code à 6 chiffres a été expédié à l&apos;adresse <strong>{email}</strong>.
                      </p>
                      <p className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                        <Info className="h-3 w-3 shrink-0" />
                        <span>Email non reçu ? Pensez à vérifier votre dossier de courriers indésirables (Spams / Junk).</span>
                      </p>
                    </div>

                    <div className="relative">
                      <Input
                        id="reg-otp"
                        required
                        maxLength={6}
                        placeholder="• • • • • •"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="h-12 rounded-xl text-center font-mono text-xl font-extrabold tracking-[0.5em] text-red-600 shadow-inner dark:text-red-400"
                      />
                    </div>

                    {devOtpHint && (
                      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-2 text-center text-[11px] text-blue-700 dark:text-blue-300">
                        <strong>Mode Test / Démo :</strong> Votre code OTP est <strong>{devOtpHint}</strong>
                      </div>
                    )}
                  </div>

                  {/* Boutons de navigation (Retour Étape 2 + Valider) */}
                  <div className="flex gap-2.5 pt-2">
                    <motion.div className="w-1/3" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => goToStep(2)}
                        className="h-10 w-full rounded-xl border-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        <ArrowLeft className="h-4 w-4" /> Retour
                      </Button>
                    </motion.div>
                    <motion.div className="w-2/3" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        disabled={loading || otp.length < 4}
                        className="h-10 w-full rounded-xl bg-red-600 text-xs font-semibold text-white shadow-lg shadow-red-600/25 hover:bg-red-700"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Finalisation…
                          </>
                        ) : (
                          <>
                            Valider et créer mon compte <CheckCircle2 className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <Separator className="my-3" />

          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>
              Déjà inscrit ?{' '}
              <Link to="/login" className="font-semibold text-red-600 hover:underline">
                Se connecter
              </Link>
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Données protégées
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
