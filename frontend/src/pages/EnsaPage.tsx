import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FolderOpen,
  FileText,
  UserCheck,
  GraduationCap,
  Users,
  Phone,
  Mail,
  ExternalLink,
  Info,
  BookOpen
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import type { FiliereItem, DriveLink } from '@/types/api';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHero, CardSkeletonGrid, Modal } from '@/components/ui';
import { cn } from '@/lib/utils';

// Type pour une carte individuelle par classe / promotion
interface ClassCardItem {
  id: string;
  filiere: FiliereItem;
  cycle: 'prepa' | 'ci';
  yearKey: 'CP1' | 'CP2' | '1A' | '2A' | '3A';
  classBadge: string;
  classTitle: string;
  yearLabel: string;
  delegates: Array<{ role: string; name: string; phone?: string | null }>;
  drives: DriveLink[];
}

export function EnsaPage() {
  // Filtre Principal (Niveau 1) : 'all' (par défaut pour la page) | 'prepa' | 'ci'
  const [mainFilter, setMainFilter] = useState<'all' | 'prepa' | 'ci'>('all');

  // Sous-filtre Année (Niveau 2, actif uniquement si mainFilter === 'ci') : '1A' (défaut) | '2A' | '3A'
  const [ciYearFilter, setCiYearFilter] = useState<'1A' | '2A' | '3A'>('1A');

  const [search, setSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState<ClassCardItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['filieres'],
    queryFn: () => apiRequest<FiliereItem[]>('/filieres')
  });

  const filieresList = data?.data ?? [];

  // Décomposition des filières en cartes individuelles par classe
  const allClasses = useMemo<ClassCardItem[]>(() => {
    const cards: ClassCardItem[] = [];

    filieresList.forEach((f) => {
      const drivesObj = (f.drives || {}) as Record<string, DriveLink[]>;

      if (f.type === 'prepa') {
        // 1. CP1
        const cp1Delegates: Array<{ role: string; name: string; phone?: string | null }> = [];
        if (f.delegue_cp1_a) cp1Delegates.push({ role: 'Section A', name: f.delegue_cp1_a, phone: f.tel_delegue_cp1_a });
        if (f.delegue_cp1_b) cp1Delegates.push({ role: 'Section B', name: f.delegue_cp1_b, phone: f.tel_delegue_cp1_b });
        if (f.delegue_cp1_c) cp1Delegates.push({ role: 'Section C', name: f.delegue_cp1_c, phone: f.tel_delegue_cp1_c });

        const cp1Drives: DriveLink[] = drivesObj['CP1'] && drivesObj['CP1'].length > 0
          ? drivesObj['CP1']
          : f.drive ? [{ label: 'Drive CP1', url: f.drive }] : [];

        cards.push({
          id: `filiere-${f.id}-cp1`,
          filiere: f,
          cycle: 'prepa',
          yearKey: 'CP1',
          classBadge: 'CP 1',
          classTitle: `${f.name} — CP1`,
          yearLabel: '1ère Année — Cycle Préparatoire',
          delegates: cp1Delegates,
          drives: cp1Drives
        });

        // 2. CP2
        const cp2Delegates: Array<{ role: string; name: string; phone?: string | null }> = [];
        if (f.delegue_cp2_a) cp2Delegates.push({ role: 'Section A', name: f.delegue_cp2_a, phone: f.tel_delegue_cp2_a });
        if (f.delegue_cp2_b) cp2Delegates.push({ role: 'Section B', name: f.delegue_cp2_b, phone: f.tel_delegue_cp2_b });
        if (f.delegue_cp2_c) cp2Delegates.push({ role: 'Section C', name: f.delegue_cp2_c, phone: f.tel_delegue_cp2_c });

        const cp2Drives: DriveLink[] = drivesObj['CP2'] && drivesObj['CP2'].length > 0
          ? drivesObj['CP2']
          : [];

        cards.push({
          id: `filiere-${f.id}-cp2`,
          filiere: f,
          cycle: 'prepa',
          yearKey: 'CP2',
          classBadge: 'CP 2',
          classTitle: `${f.name} — CP2`,
          yearLabel: '2ème Année — Cycle Préparatoire',
          delegates: cp2Delegates,
          drives: cp2Drives
        });
      } else {
        // Cycle Ingénieur : 3 cartes (1A, 2A, 3A)

        // 1. 1ère Année CI (1A)
        const ci1Delegates: Array<{ role: string; name: string; phone?: string | null }> = [];
        if (f.delegue_annee1) {
          ci1Delegates.push({ role: 'Délégué de la classe', name: f.delegue_annee1, phone: f.tel_delegue_annee1 });
        }
        const ci1Drives: DriveLink[] = drivesObj['1A'] && drivesObj['1A'].length > 0
          ? drivesObj['1A']
          : f.drive ? [{ label: `Drive 1A ${f.abbreviation}`, url: f.drive }] : [];

        cards.push({
          id: `filiere-${f.id}-1A`,
          filiere: f,
          cycle: 'ci',
          yearKey: '1A',
          classBadge: `${f.abbreviation} 1`,
          classTitle: `${f.name} — 1ère Année CI`,
          yearLabel: '1ère Année Cycle Ingénieur (1A)',
          delegates: ci1Delegates,
          drives: ci1Drives
        });

        // 2. 2ème Année CI (2A)
        const ci2Delegates: Array<{ role: string; name: string; phone?: string | null }> = [];
        if (f.delegue_annee2) {
          ci2Delegates.push({ role: 'Délégué de la classe', name: f.delegue_annee2, phone: f.tel_delegue_annee2 });
        }
        const ci2Drives: DriveLink[] = drivesObj['2A'] && drivesObj['2A'].length > 0
          ? drivesObj['2A']
          : [];

        cards.push({
          id: `filiere-${f.id}-2A`,
          filiere: f,
          cycle: 'ci',
          yearKey: '2A',
          classBadge: `${f.abbreviation} 2`,
          classTitle: `${f.name} — 2ème Année CI`,
          yearLabel: '2ème Année Cycle Ingénieur (2A)',
          delegates: ci2Delegates,
          drives: ci2Drives
        });

        // 3. 3ème Année CI (3A)
        const ci3Delegates: Array<{ role: string; name: string; phone?: string | null }> = [];
        if (f.delegue_annee3) {
          ci3Delegates.push({ role: 'Délégué de la classe', name: f.delegue_annee3, phone: f.tel_delegue_annee3 });
        }
        const ci3Drives: DriveLink[] = drivesObj['3A'] && drivesObj['3A'].length > 0
          ? drivesObj['3A']
          : [];

        cards.push({
          id: `filiere-${f.id}-3A`,
          filiere: f,
          cycle: 'ci',
          yearKey: '3A',
          classBadge: `${f.abbreviation} 3`,
          classTitle: `${f.name} — 3ème Année CI`,
          yearLabel: '3ème Année Cycle Ingénieur (3A)',
          delegates: ci3Delegates,
          drives: ci3Drives
        });
      }
    });

    return cards;
  }, [filieresList]);

  // Filtrage combiné : Niveau 1 (Cycle) + Niveau 2 (Année CI si sélectionné) + Recherche
  const displayedCards = useMemo(() => {
    return allClasses.filter((card) => {
      // Filtrage Niveau 1
      if (mainFilter === 'prepa') {
        if (card.cycle !== 'prepa') return false;
      } else if (mainFilter === 'ci') {
        if (card.cycle !== 'ci') return false;
        // Filtrage Niveau 2 : Année spécifique de CI (1A, 2A, 3A)
        if (card.yearKey !== ciYearFilter) return false;
      }

      // Recherche textuelle
      if (!search.trim()) return true;

      const q = search.toLowerCase();
      const matchText = [
        card.classTitle,
        card.classBadge,
        card.filiere.name,
        card.filiere.abbreviation,
        card.filiere.responsable_pedagogique ?? '',
        ...card.delegates.map((d) => d.name)
      ].join(' ').toLowerCase();

      return matchText.includes(q);
    });
  }, [allClasses, mainFilter, ciYearFilter, search]);

  return (
    <div className="space-y-8">
      <PageHero
        badge="Excellence Académique"
        title="ENSA Fès — Filières & Classes"
        subtitle="Explorez le Cycle Préparatoire et chaque promotion du Cycle Ingénieur avec accès direct aux délégués et drives de cours de votre classe."
        image="/images/hero-about.png"
      />

      {/* Barre de filtres dans un seul cadre compact + Recherche */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Le cadre unique pour tous les filtres */}
        <div className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/80">
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setMainFilter('all')}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
              mainFilter === 'all'
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            )}
          >
            Toutes
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setMainFilter('prepa')}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
              mainFilter === 'prepa'
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            )}
          >
            Cycle Préparatoire
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => {
              setMainFilter('ci');
              setCiYearFilter('1A');
            }}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
              mainFilter === 'ci'
                ? "bg-red-600 text-white shadow-xs font-bold"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            )}
          >
            Cycle Ingénieur
          </motion.button>

          {/* Sous-filtres CI 1, CI 2, CI 3 avec animation douce dans le MÊME cadre */}
          <AnimatePresence mode="wait">
            {mainFilter === 'ci' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, x: -6 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.92, x: -6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex items-center gap-1 pl-1 border-l border-zinc-300 dark:border-zinc-700"
              >
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setCiYearFilter('1A')}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-bold transition",
                    ciYearFilter === '1A'
                      ? "bg-white text-red-600 shadow-xs dark:bg-zinc-900 dark:text-red-400"
                      : "text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-700/60"
                  )}
                >
                  CI 1
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setCiYearFilter('2A')}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-bold transition",
                    ciYearFilter === '2A'
                      ? "bg-white text-red-600 shadow-xs dark:bg-zinc-900 dark:text-red-400"
                      : "text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-700/60"
                  )}
                >
                  CI 2
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setCiYearFilter('3A')}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-bold transition",
                    ciYearFilter === '3A'
                      ? "bg-white text-red-600 shadow-xs dark:bg-zinc-900 dark:text-red-400"
                      : "text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-700/60"
                  )}
                >
                  CI 3
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Barre de Recherche rapide */}
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une classe, délégué..."
            className="h-10 rounded-xl pl-10 text-xs"
          />
        </div>
      </div>

      {/* Liste des cartes individuelles par classe */}
      {isLoading ? (
        <CardSkeletonGrid count={6} />
      ) : displayedCards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
          <GraduationCap className="mx-auto h-10 w-10 text-zinc-400" />
          <h3 className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-100">Aucune classe trouvée</h3>
          <p className="mt-1 text-xs text-zinc-500">Essayez de modifier vos critères de recherche ou de filtre.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {displayedCards.map((card, idx) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(idx * 0.03, 0.25) }}
              whileHover={{ y: -3 }}
              className="group flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm transition hover:border-red-500/50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="space-y-3.5">
                {/* En-tête de carte : Badge Classe & Année */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1 text-xs font-black tracking-wide text-white shadow-xs">
                    <GraduationCap className="h-3.5 w-3.5" /> {card.classBadge}
                  </span>
                  <Badge variant="secondary" className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                    {card.cycle === 'prepa' ? 'Classes Prépa' : card.yearLabel.split('(')[0].trim()}
                  </Badge>
                </div>

                {/* Titre de la promotion */}
                <div>
                  <h3 className="text-base font-black leading-snug text-zinc-900 transition group-hover:text-red-600 dark:text-zinc-100">
                    {card.classTitle}
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {card.yearLabel}
                  </p>
                </div>

                {/* Coordinateur de la filière */}
                {card.filiere.responsable_pedagogique && (
                  <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-xs dark:bg-zinc-800/50">
                    <UserCheck className="h-4 w-4 shrink-0 text-red-600" />
                    <div className="truncate">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        Prof. Coordinateur
                      </span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                        {card.filiere.responsable_pedagogique}
                      </span>
                    </div>
                  </div>
                )}

                {/* Délégués de cette classe spécifique */}
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 text-xs dark:border-zinc-800/80 dark:bg-zinc-800/30">
                  <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <Users className="h-3.5 w-3.5 text-red-600" />
                    <span>{card.cycle === 'prepa' ? 'Délégués de Sections' : 'Délégué de la classe'}</span>
                  </div>

                  {card.delegates.length === 0 ? (
                    <p className="text-[11px] italic text-zinc-400">Non assigné pour le moment</p>
                  ) : (
                    <div className="space-y-1">
                      {card.delegates.map((d, dIdx) => (
                        <div key={dIdx} className="flex items-center justify-between gap-1 text-[11px]">
                          <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                            {card.cycle === 'prepa' ? `${d.role} :` : 'Nom :'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              {d.name}
                            </span>
                            {d.phone && (
                              <a
                                href={`tel:${d.phone}`}
                                title={`Appeler ${d.name} (${d.phone})`}
                                className="inline-flex items-center text-zinc-400 hover:text-red-600 transition"
                              >
                                <Phone className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Drives de cours de cette classe */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <FolderOpen className="h-3.5 w-3.5 text-red-600" />
                    <span>Drives de cours</span>
                  </div>

                  {card.drives.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {card.drives.map((d, dIdx) => (
                        <a
                          key={dIdx}
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-red-700"
                        >
                          <FolderOpen className="h-3.5 w-3.5" />
                          <span>{d.label || `Drive ${card.classBadge}`}</span>
                          <ExternalLink className="h-3 w-3 opacity-70" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span className="inline-block rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-400 dark:bg-zinc-800">
                      Drive bientôt disponible
                    </span>
                  )}
                </div>
              </div>

              {/* Pied de carte : Actions & Bouton Plus de détails */}
              <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3.5 dark:border-zinc-800">
                {card.filiere.documentation ? (
                  <a
                    href={card.filiere.documentation}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-red-600 transition"
                  >
                    <FileText className="h-3.5 w-3.5" /> Descriptif PDF
                  </a>
                ) : (
                  <span />
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCard(card)}
                  className="gap-1.5 rounded-xl border-zinc-200 text-xs font-bold hover:border-red-500/60 hover:text-red-600 dark:border-zinc-800"
                >
                  <Info className="h-3.5 w-3.5" />
                  Plus de détails
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Plus de détails */}
      {selectedCard && (
        <Modal
          open={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          title={`Détails : ${selectedCard.classTitle}`}
        >
          <div className="space-y-5 text-sm text-zinc-700 dark:text-zinc-300">
            {/* En-tête modal avec badge et intitulé */}
            <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1 text-xs font-black text-white">
                <GraduationCap className="h-3.5 w-3.5" /> {selectedCard.classBadge}
              </span>
              <div>
                <h4 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                  {selectedCard.filiere.name}
                </h4>
                <p className="text-xs text-zinc-500">{selectedCard.yearLabel}</p>
              </div>
            </div>

            {/* Description complète */}
            <div>
              <h5 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                <BookOpen className="h-3.5 w-3.5 text-red-600" /> Présentation & Objectifs
              </h5>
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 whitespace-pre-line bg-zinc-50 dark:bg-zinc-800/40 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                {selectedCard.filiere.description || 'Aucune description détaillée n\'est encore renseignée pour cette filière.'}
              </p>
            </div>

            {/* Coordination pédagogique */}
            {selectedCard.filiere.responsable_pedagogique && (
              <div>
                <h5 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  <UserCheck className="h-3.5 w-3.5 text-red-600" /> Coordination Pédagogique
                </h5>
                <div className="rounded-xl border border-zinc-200/80 bg-white p-3 space-y-1.5 text-xs dark:border-zinc-800 dark:bg-zinc-800/40">
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">
                    {selectedCard.filiere.responsable_pedagogique}
                  </p>
                  {selectedCard.filiere.responsable_contact && (
                    <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                      {selectedCard.filiere.responsable_contact.includes('@') ? (
                        <a
                          href={`mailto:${selectedCard.filiere.responsable_contact}`}
                          className="inline-flex items-center gap-1 hover:text-red-600 transition"
                        >
                          <Mail className="h-3.5 w-3.5 text-red-600" /> {selectedCard.filiere.responsable_contact}
                        </a>
                      ) : (
                        <a
                          href={`tel:${selectedCard.filiere.responsable_contact}`}
                          className="inline-flex items-center gap-1 hover:text-red-600 transition"
                        >
                          <Phone className="h-3.5 w-3.5 text-red-600" /> {selectedCard.filiere.responsable_contact}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Délégués de cette classe */}
            <div>
              <h5 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                <Users className="h-3.5 w-3.5 text-red-600" /> {selectedCard.cycle === 'prepa' ? `Délégués de Sections (${selectedCard.classBadge})` : `Délégué de la classe (${selectedCard.classBadge})`}
              </h5>
              <div className="rounded-xl border border-zinc-200/80 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-800/40">
                {selectedCard.delegates.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">Aucun délégué assigné pour le moment.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedCard.delegates.map((d, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-zinc-100 pb-1.5 last:border-0 last:pb-0 dark:border-zinc-800">
                        <span className="font-semibold text-zinc-600 dark:text-zinc-400">{d.role}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{d.name}</span>
                          {d.phone && (
                            <a
                              href={`tel:${d.phone}`}
                              className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 hover:bg-red-50 hover:text-red-600 transition dark:bg-zinc-800 dark:text-zinc-300"
                            >
                              <Phone className="h-3 w-3" /> {d.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drives de cours */}
            <div>
              <h5 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                <FolderOpen className="h-3.5 w-3.5 text-red-600" /> Liens Google Drive ({selectedCard.classBadge})
              </h5>
              {selectedCard.drives.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedCard.drives.map((d, i) => (
                    <a
                      key={i}
                      href={d.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-50/50 p-2.5 text-xs font-semibold text-red-700 hover:bg-red-600 hover:text-white transition shadow-2xs dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-600 dark:hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" /> {d.label || `Drive ${selectedCard.classBadge}`}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic">Aucun drive n'a encore été rattaché à cette promotion.</p>
              )}
            </div>

            {/* Descriptif officiel PDF */}
            {selectedCard.filiere.documentation && (
              <div className="pt-2">
                <a
                  href={selectedCard.filiere.documentation}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-zinc-300 p-2.5 text-xs font-bold hover:bg-zinc-50 transition dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  <FileText className="h-4 w-4 text-red-600" />
                  Consulter le descriptif pédagogique officiel (PDF)
                  <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                </a>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
