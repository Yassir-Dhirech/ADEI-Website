import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Users, Mail, Phone, Globe, Trophy, Sparkles } from 'lucide-react';
import { apiRequest, getImageUrl } from '@/lib/api';
import type { ClubItem } from '@/types/api';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { PageHero, Modal, CardSkeletonGrid } from '@/components/ui';

export function ClubsPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ClubItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => apiRequest<ClubItem[]>('/clubs')
  });

  const clubs = (data?.data ?? []).filter((c) =>
    `${c.club} ${c.president} ${c.description}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <PageHero
        badge="Vie Associative · ENSA Fès"
        title="Les Clubs Étudiants"
        subtitle="IA, cybersécurité, robotique, débat, entrepreneuriat, théâtre et sport — trouvez votre équipe et lancez des projets concrets."
        image="/images/hero-clubs.png"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un club, un président ou un thème…"
            className="h-11 rounded-xl pl-10"
          />
        </div>
        <p className="text-xs font-medium text-zinc-500">
          {clubs.length} club{clubs.length > 1 ? 's' : ''} actif{clubs.length > 1 ? 's' : ''}
        </p>
      </div>

      {isLoading ? (
        <CardSkeletonGrid count={6} />
      ) : clubs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 py-14 text-center text-sm text-zinc-500 dark:border-zinc-800">
          Aucun club trouvé pour « {search} ».
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clubs.map((c, idx) => (
            <motion.article
              key={c.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(idx * 0.04, 0.25) }}
              whileHover={{ y: -4 }}
              onClick={() => setSelected(c)}
              className="group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-sm transition hover:border-red-500/50 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Subtle top crimson accent bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-rose-500 to-zinc-800 opacity-75 transition group-hover:opacity-100" />

              <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="flex items-center gap-3.5">
                  <Avatar className="h-14 w-14 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                    <AvatarImage src={getImageUrl(c.image)} alt={c.club} className="rounded-2xl" />
                    <AvatarFallback className="rounded-2xl bg-red-600/10 font-bold text-red-600">
                      {c.club.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-extrabold group-hover:text-red-600">{c.club}</h2>
                    <p className="truncate text-xs text-zinc-500">Président : {c.president}</p>
                  </div>
                </div>

                <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {c.description || 'Club actif au sein de la communauté étudiante ENSA Fès.'}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="flex flex-wrap gap-1.5">
                    {c.activities.slice(0, 2).map((act, i) => (
                      <Badge key={i} variant="secondary" className="text-[11px]">{act}</Badge>
                    ))}
                    {c.activities.length === 0 && (
                      <Badge variant="secondary" className="text-[11px]">{c.annees_etude}</Badge>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                    {c.members > 0 ? <><Users className="h-3.5 w-3.5" /> {c.members}</> : 'Explorer →'}
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.club || ''}>
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <img src={getImageUrl(selected.image)} alt={selected.club} className="h-20 w-20 rounded-2xl border border-zinc-200 object-cover dark:border-zinc-700" />
              <div className="space-y-1 text-xs text-zinc-500">
                <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {selected.president} <span className="font-normal text-zinc-500">({selected.annees_etude})</span>
                </p>
                <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-red-600" /> {selected.email}</p>
                <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-red-600" /> {selected.tel}</p>
              </div>
            </div>

            <Separator />

            <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {selected.description}
            </p>

            {selected.activities.length > 0 && (
              <div className="space-y-2">
                <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <Sparkles className="h-3.5 w-3.5 text-red-500" /> Activités
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {selected.activities.map((a, i) => <Badge key={i} variant="secondary">{a}</Badge>)}
                </div>
              </div>
            )}

            {selected.achievements.length > 0 && (
              <div className="space-y-2">
                <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" /> Réalisations
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {selected.achievements.map((a, i) => <Badge key={i} variant="outline">{a}</Badge>)}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2 text-xs font-semibold">
              {selected.website && <a href={selected.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 px-3.5 py-2 dark:border-zinc-700"><Globe className="h-3.5 w-3.5" /> Site web</a>}
              {selected.instagram && <a href={selected.instagram} target="_blank" rel="noreferrer" className="rounded-xl bg-pink-500/10 px-3.5 py-2 text-pink-600">Instagram</a>}
              {selected.linkedin && <a href={selected.linkedin} target="_blank" rel="noreferrer" className="rounded-xl bg-blue-500/10 px-3.5 py-2 text-blue-600">LinkedIn</a>}
              {selected.facebook && <a href={selected.facebook} target="_blank" rel="noreferrer" className="rounded-xl bg-indigo-500/10 px-3.5 py-2 text-indigo-600">Facebook</a>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
