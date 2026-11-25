import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, MapPin, Clock, ExternalLink, CalendarDays, ArrowRight, Users, Archive } from 'lucide-react';
import { apiRequest, getImageUrl } from '@/lib/api';
import type { EventItem } from '@/types/api';
import { PageHero, Modal, CardSkeletonGrid } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

function parseSafeDate(dateStr?: string | null, timeStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  let year: number | null = null;
  let month: number | null = null;
  let day: number | null = null;

  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    month = parseInt(isoMatch[2], 10) - 1;
    day = parseInt(isoMatch[3], 10);
  } else {
    const frMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (frMatch) {
      day = parseInt(frMatch[1], 10);
      month = parseInt(frMatch[2], 10) - 1;
      year = parseInt(frMatch[3], 10);
    }
  }

  let d: Date;
  if (year !== null && month !== null && day !== null) {
    d = new Date(year, month, day);
  } else {
    d = new Date(trimmed);
  }

  if (isNaN(d.getTime())) return null;

  if (timeStr && typeof timeStr === 'string' && timeStr.includes(':')) {
    const [h, m] = timeStr.split(':').map((s) => parseInt(s, 10));
    if (!isNaN(h)) d.setHours(h);
    if (!isNaN(m)) d.setMinutes(m);
  }

  return d;
}

function checkIsPast(dateStr?: string | null, timeStr?: string | null): boolean {
  if (!dateStr) return false;
  const parsed = parseSafeDate(dateStr, timeStr);
  if (!parsed) return false;
  const now = new Date();
  if (!timeStr) {
    const endOfDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 23, 59, 59, 999);
    return endOfDay.getTime() < now.getTime();
  }
  return parsed.getTime() < now.getTime();
}

function formatDateBadge(dateStr: string) {
  const parsed = parseSafeDate(dateStr);
  if (!parsed) {
    return { day: '—', month: dateStr.slice(0, 6) };
  }
  return {
    day: String(parsed.getDate()).padStart(2, '0'),
    month: parsed.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '').toUpperCase()
  };
}

function getGoogleCalendarUrl(ev: EventItem): string {
  const [hours, minutes] = (ev.time || '10:00').split(':').map((s) => s.padStart(2, '0'));
  const d = parseSafeDate(ev.date, ev.time) || new Date(ev.date);
  if (isNaN(d.getTime())) return '#';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  const startStr = `${year}${month}${day}T${hours || '10'}${minutes || '00'}00`;
  const endHours = String(Math.min(23, Number(hours || 10) + 2)).padStart(2, '0');
  const endStr = `${year}${month}${day}T${endHours}${minutes || '00'}00`;

  const title = encodeURIComponent(`[ADEI ENSA Fès] ${ev.title}`);
  const details = encodeURIComponent(`${ev.description}\n\nOrganisateur: ${ev.organizer || 'ADEI ENSA Fès'}`);
  const location = encodeURIComponent(ev.location || 'ENSA Fès');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
}

export function EventsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'upcoming' | 'past'>('all');
  const [selected, setSelected] = useState<EventItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['events', page],
    queryFn: () => apiRequest<EventItem[]>(`/events?page=${page}&limit=9`)
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const items = (data?.data ?? []).filter((ev) =>
    `${ev.title} ${ev.description} ${ev.location} ${ev.organizer ?? ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredItems = items.filter((ev) => {
    if (filterTab === 'all') return true;
    const isPast = checkIsPast(ev.date, ev.time);
    return filterTab === 'upcoming' ? !isPast : isPast;
  });

  const meta = data?.meta;

  return (
    <div className="space-y-8">
      <PageHero
        badge="Agenda Étudiant"
        title="Événements & Activités"
        subtitle="Workshops, hackathons, forums entreprises, compétitions sportives et soirées culturelles à l'ENSA Fès."
        image="/images/hero-news.png"
      />

      {/* Search & Filter bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white/80 p-4 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-900/70 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un événement, un lieu ou un organisateur…"
            className="h-10 rounded-xl pl-9"
          />
        </div>

        {/* Onglets Filtre */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'upcoming', label: 'À venir' },
            { id: 'past', label: 'Archives' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id as 'all' | 'upcoming' | 'past')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                filterTab === tab.id
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <Badge variant="secondary" className="ml-1 gap-1 px-2.5 py-1 text-xs">
            <CalendarDays className="h-3.5 w-3.5 text-red-600" />
            {filteredItems.length}
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <CardSkeletonGrid count={6} />
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white/60 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <CalendarDays className="mb-3 h-10 w-10 text-zinc-400" />
          <p className="text-base font-semibold">Aucun événement trouvé</p>
          <p className="mt-1 text-sm text-zinc-500">Aucun résultat ne correspond à votre recherche ou filtre.</p>
          {search && (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearch('')}>
              Effacer la recherche
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((ev, idx) => {
            const isPast = checkIsPast(ev.date, ev.time);
            const badge = formatDateBadge(ev.date);
            return (
              <motion.article
                key={ev.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.04, 0.25) }}
                onClick={() => setSelected(ev)}
                className={`group flex cursor-pointer flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  isPast
                    ? 'border-zinc-300/80 bg-zinc-100/75 opacity-70 grayscale-[85%] hover:opacity-100 hover:grayscale-0 hover:bg-white dark:border-zinc-800/60 dark:bg-zinc-900/50 dark:hover:bg-zinc-900'
                    : 'border-zinc-200/80 bg-white shadow-sm hover:border-red-500/50 dark:border-zinc-800/80 dark:bg-zinc-900/90'
                }`}
              >
                <div className="relative h-48 overflow-hidden bg-zinc-900">
                  <img
                    src={ev.image ? getImageUrl(ev.image) : '/images/default.jpg'}
                    alt={ev.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {/* Floating calendar chip */}
                  <div className="absolute left-3 top-3 flex flex-col items-center rounded-xl bg-white/95 px-2.5 py-1.5 text-center shadow-md backdrop-blur dark:bg-zinc-950/90">
                    <span className={`text-lg font-extrabold leading-none ${isPast ? 'text-zinc-500 dark:text-zinc-400' : 'text-red-600'}`}>{badge.day}</span>
                    <span className="mt-0.5 text-[10px] font-bold tracking-wider text-zinc-600 dark:text-zinc-300">
                      {badge.month}
                    </span>
                  </div>
                  <div className="absolute right-3 top-3">
                    {isPast ? (
                      <Badge variant="secondary" className="gap-1 border border-zinc-700/60 bg-zinc-950/85 text-zinc-300 backdrop-blur shadow">
                        <Archive className="h-3 w-3 text-zinc-400" /> Archivé
                      </Badge>
                    ) : (
                      <Badge className="gap-1 bg-red-600 text-white shadow">
                        <CalendarDays className="h-3 w-3" /> Événement
                      </Badge>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-medium text-white">
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-0.5 backdrop-blur">
                      <Clock className={`h-3 w-3 ${isPast ? 'text-zinc-300' : 'text-red-400'}`} /> {ev.time}
                    </span>
                    {ev.organizer && (
                      <span className="truncate rounded-full bg-black/50 px-2.5 py-0.5 backdrop-blur">
                        {ev.organizer}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h2 className={`text-lg font-bold leading-snug transition ${isPast ? 'text-zinc-700 group-hover:text-zinc-950 dark:text-zinc-300 dark:group-hover:text-white' : 'group-hover:text-red-600'}`}>
                    {ev.title}
                  </h2>
                  <p className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold ${isPast ? 'text-zinc-500 dark:text-zinc-400' : 'text-red-600 dark:text-red-400'}`}>
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{ev.location}</span>
                  </p>
                  <p className="mt-3 line-clamp-3 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {ev.description}
                  </p>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className={`inline-flex items-center gap-1 transition ${isPast ? 'text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-200' : 'text-red-600 group-hover:translate-x-0.5'}`}>
                      {isPast ? "Consulter l'archive" : 'Voir le programme'} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                    {ev.link && (
                      <Badge variant="secondary" className="text-[11px]">
                        Inscription
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Précédent
          </Button>
          <span className="rounded-full bg-zinc-100 px-3.5 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            Page {meta.page} / {meta.totalPages}
          </span>
          <Button variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
            Suivant
          </Button>
        </div>
      )}

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title || ''}>
        {selected && (
          <div className="space-y-5">
            {selected.image && (
              <img
                src={getImageUrl(selected.image)}
                alt={selected.title}
                className="max-h-72 w-full rounded-xl object-cover"
              />
            )}
            {selected.date && checkIsPast(selected.date, selected.time) && (
              <div className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-100/90 px-3.5 py-2.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-400">
                <Archive className="h-4 w-4 shrink-0 text-zinc-500" />
                <span>Cet événement a déjà eu lieu et fait partie des archives du campus.</span>
              </div>
            )}
            <div className="grid gap-2.5 rounded-2xl bg-zinc-50 p-4 text-xs dark:bg-zinc-800/60 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-red-600" />
                <span className="font-semibold">{selected.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-600" />
                <span className="font-semibold">{selected.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-600" />
                <span className="font-semibold">{selected.location}</span>
              </div>
              {selected.organizer && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-red-600" />
                  <span className="font-semibold">{selected.organizer}</span>
                </div>
              )}
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {selected.description}
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <a
                href={getGoogleCalendarUrl(selected)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                <CalendarDays className="h-4 w-4 text-zinc-500" /> Ajouter à Google Agenda
              </a>
              {selected.link && (
                <a
                  href={selected.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
                >
                  <ExternalLink className="h-4 w-4" /> Participer / En savoir plus
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
