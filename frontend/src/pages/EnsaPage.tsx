import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, FolderOpen, FileText, UserCheck, GraduationCap } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import type { FiliereItem } from '@/types/api';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHero, CardSkeletonGrid } from '@/components/ui';

export function EnsaPage() {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['filieres'],
    queryFn: () => apiRequest<FiliereItem[]>('/filieres')
  });

  const filieres = (data?.data ?? []).filter((f) => {
    if (filter !== 'all' && f.type !== filter) return false;
    return `${f.name} ${f.abbreviation} ${f.description ?? ''}`.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-8">
      <PageHero
        badge="Excellence Académique"
        title="ENSA Fès — Filières & Cycles"
        subtitle="Explorez le Cycle Préparatoire et toutes les spécialités du Cycle Ingénieur, avec accès direct aux drives de cours et descriptifs officiels."
        image="/images/hero-about.png"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(val) => setFilter(String(val))}>
          <TabsList className="h-10 rounded-xl p-1">
            <TabsTrigger value="all" className="rounded-lg px-4">Toutes ({data?.data.length ?? 0})</TabsTrigger>
            <TabsTrigger value="filiere" className="rounded-lg px-4">Cycle Ingénieur</TabsTrigger>
            <TabsTrigger value="prepa" className="rounded-lg px-4">Classes Prépa</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (GI, GTR, GES, CP…)"
            className="h-10 rounded-xl pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <CardSkeletonGrid count={6} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filieres.map((f, idx) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(idx * 0.04, 0.25) }}
              whileHover={{ y: -4 }}
              className="group flex flex-col justify-between rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm transition hover:border-red-500/60 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1 text-xs font-extrabold tracking-wide text-white shadow-sm">
                    <GraduationCap className="h-3.5 w-3.5" /> {f.abbreviation}
                  </span>
                  <Badge variant="secondary">{f.type === 'prepa' ? 'Cycle Prépa' : 'Cycle Ingénieur'}</Badge>
                </div>

                <h2 className="text-lg font-extrabold leading-snug group-hover:text-red-600">{f.name}</h2>

                {f.description && (
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{f.description}</p>
                )}

                {f.responsable_pedagogique && (
                  <p className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                    <UserCheck className="h-3.5 w-3.5 text-red-600" /> {f.responsable_pedagogique}
                  </p>
                )}

                {/* Délégués assignés */}
                {f.type === 'filiere' ? (
                  (f.delegue_annee1 || f.delegue_annee2 || f.delegue_annee3) && (
                    <div className="rounded-xl bg-zinc-50 p-2.5 text-xs text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
                      <p className="font-semibold text-[11px] text-zinc-400 uppercase tracking-wider mb-1">
                        Délégués de promotion
                      </p>
                      <div className="space-y-0.5 text-[11px]">
                        {f.delegue_annee1 && <p>1A : <span className="font-medium text-zinc-800 dark:text-zinc-200">{f.delegue_annee1}</span></p>}
                        {f.delegue_annee2 && <p>2A : <span className="font-medium text-zinc-800 dark:text-zinc-200">{f.delegue_annee2}</span></p>}
                        {f.delegue_annee3 && <p>3A : <span className="font-medium text-zinc-800 dark:text-zinc-200">{f.delegue_annee3}</span></p>}
                      </div>
                    </div>
                  )
                ) : (
                  (f.delegue_cp1_a || f.delegue_cp1_b || f.delegue_cp1_c || f.delegue_cp2_a || f.delegue_cp2_b || f.delegue_cp2_c) && (
                    <div className="rounded-xl bg-zinc-50 p-2.5 text-xs text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
                      <p className="font-semibold text-[11px] text-zinc-400 uppercase tracking-wider mb-1">
                        Délégués de sections
                      </p>
                      <div className="space-y-0.5 text-[11px]">
                        {(f.delegue_cp1_a || f.delegue_cp1_b || f.delegue_cp1_c) && (
                          <p>CP1 : <span className="font-medium text-zinc-800 dark:text-zinc-200">{[f.delegue_cp1_a, f.delegue_cp1_b, f.delegue_cp1_c].filter(Boolean).join(' • ')}</span></p>
                        )}
                        {(f.delegue_cp2_a || f.delegue_cp2_b || f.delegue_cp2_c) && (
                          <p>CP2 : <span className="font-medium text-zinc-800 dark:text-zinc-200">{[f.delegue_cp2_a, f.delegue_cp2_b, f.delegue_cp2_c].filter(Boolean).join(' • ')}</span></p>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                {f.drive ? (
                  <a
                    href={f.drive}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                  >
                    <FolderOpen className="h-3.5 w-3.5" /> Drive Cours
                  </a>
                ) : (
                  <span className="rounded-xl bg-zinc-100 px-3 py-1.5 text-xs text-zinc-400 dark:bg-zinc-800">Drive bientôt disponible</span>
                )}
                {f.documentation && (
                  <a
                    href={f.documentation}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 px-3.5 py-2 text-xs font-semibold transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    <FileText className="h-3.5 w-3.5" /> Descriptif
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
