import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search,
  FileText,
  ExternalLink,
  Calendar,
  CalendarDays,
  CalendarPlus,
  Clock,
  MapPin,
  ArrowRight,
  Newspaper,
  Users,
  Layers,
  Archive,
  CheckCircle2,
  Ticket,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { apiRequest, getImageUrl } from '@/lib/api';
import type { EventItem, NewsItem } from '@/types/api';
import { PageHero, Modal, CardSkeletonGrid } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type FeedTab = 'all' | 'news' | 'events';

type UnifiedItem =
  | { kind: 'news'; sortDate: string; item: NewsItem }
  | { kind: 'event'; sortDate: string; item: EventItem };

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

function getEventCountdown(dateStr?: string | null, timeStr?: string | null): string | null {
  const target = parseSafeDate(dateStr, timeStr);
  if (!target) return null;

  const now = new Date();
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffDays = Math.round((targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Événement déjà passé ou aujourd'hui après l'horaire
  if (diffDays < 0) return null;
  if (diffDays === 0 && timeStr && target.getTime() < now.getTime()) return null;

  // Plus de 10 jours
  if (diffDays > 10) return null;

  // Entre 0 et 10 jours
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Demain';
  return `Dans ${diffDays} jours`;
}
function formatDateBadge(dateStr?: string | null) {
  if (!dateStr) return { day: '—', month: '—' };
  const parsed = parseSafeDate(dateStr);
  if (!parsed) {
    return { day: '—', month: String(dateStr).slice(0, 6) };
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

export function NewsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: FeedTab = rawTab === 'news' || rawTab === 'events' ? rawTab : 'all';

  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Formulaire d'inscription manuelle invité
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestFiliere, setGuestFiliere] = useState('Génie Informatique');
  const [guestConsent, setGuestConsent] = useState(false);
  const [guestRegisteredEvents, setGuestRegisteredEvents] = useState<number[]>([]);

  // Mutation d'inscription / désinscription en 1 clic
  const registerMutation = useMutation({
    mutationFn: async (eventId: number) => {
      return apiRequest<{ registered: boolean; count: number }>(`/events/${eventId}/register`, {
        method: 'POST'
      });
    },
    onSuccess: (res, eventId) => {
      const isReg = res.data?.registered;
      const count = res.data?.count;
      toast.success(
        isReg
          ? 'Votre inscription a été confirmée avec succès !'
          : 'Votre désinscription a bien été prise en compte.'
      );
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setSelectedEvent((prev) =>
        prev && prev.id === eventId
          ? {
              ...prev,
              isRegistered: isReg,
              registrationsCount: count
            }
          : prev
      );
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'inscription");
    }
  });

  // Mutation d'inscription invité (sans compte)
  const guestRegisterMutation = useMutation({
    mutationFn: async ({
      eventId,
      data
    }: {
      eventId: number;
      data: { guestName: string; guestEmail: string; guestPhone: string; guestFiliere: string };
    }) => {
      return apiRequest<{ count: number }>(`/events/${eventId}/register-guest`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (res, variables) => {
      toast.success('Votre inscription a été confirmée avec succès !');
      setGuestRegisteredEvents((prev) => [...prev, variables.eventId]);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setSelectedEvent((prev) =>
        prev && prev.id === variables.eventId
          ? {
              ...prev,
              registrationsCount: res.data?.count ?? (prev.registrationsCount || 0) + 1
            }
          : prev
      );
      setGuestName('');
      setGuestEmail('');
      setGuestPhone('');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'inscription");
    }
  });

  const newsQuery = useQuery({
    queryKey: ['news', 'unified'],
    queryFn: () => apiRequest<NewsItem[]>('/news?page=1&limit=50')
  });

  const eventsQuery = useQuery({
    queryKey: ['events', 'unified'],
    queryFn: () => apiRequest<EventItem[]>('/events?page=1&limit=50')
  });

  const allNews = newsQuery.data?.data ?? [];
  const allEvents = eventsQuery.data?.data ?? [];
  const isLoading = newsQuery.isLoading || eventsQuery.isLoading;

  const setTab = (next: FeedTab) => {
    setTimeFilter('all');
    if (next === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: next });
    }
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const feed = useMemo<UnifiedItem[]>(() => {
    const q = search.trim().toLowerCase();
    const list: UnifiedItem[] = [];

    const matchesTime = (dateStr?: string | null, timeStr?: string | null) => {
      if (timeFilter === 'all' || !dateStr) return true;
      const isPast = checkIsPast(dateStr, timeStr);
      return timeFilter === 'upcoming' ? !isPast : isPast;
    };

    if (activeTab === 'all' || activeTab === 'news') {
      for (const n of allNews) {
        const matchesSearch =
          !q ||
          `${n.title} ${n.content} ${n.category ?? ''} ${n.organizer ?? ''}`.toLowerCase().includes(q);
        if (matchesSearch && matchesTime(n.date)) {
          list.push({ kind: 'news', sortDate: n.date, item: n });
        }
      }
    }

    if (activeTab === 'all' || activeTab === 'events') {
      for (const e of allEvents) {
        const matchesSearch =
          !q ||
          `${e.title} ${e.description} ${e.location} ${e.category ?? ''} ${e.organizer ?? ''}`
            .toLowerCase()
            .includes(q);
        if (matchesSearch && matchesTime(e.date, e.time)) {
          list.push({ kind: 'event', sortDate: e.date, item: e });
        }
      }
    }

        return list.sort((a, b) => {
      const aTime = a.kind === 'event' ? a.item.time : undefined;
      const bTime = b.kind === 'event' ? b.item.time : undefined;
      const aPast = checkIsPast(a.sortDate, aTime);
      const bPast = checkIsPast(b.sortDate, bTime);

      // Dans la vue 'all' (Tout) : les éléments à venir passent obligatoirement en premier
      if (timeFilter === 'all') {
        if (aPast && !bPast) return 1;
        if (!aPast && bPast) return -1;
      }

      // Éléments à venir : classés par ordre chronologique (le plus proche en premier)
      if (!aPast && !bPast) {
        return (a.sortDate || '').localeCompare(b.sortDate || '');
      }

      // Éléments passés (archives) : classés du plus récent au plus ancien
      return (b.sortDate || '').localeCompare(a.sortDate || '');
    });
  }, [activeTab, allNews, allEvents, search, timeFilter]);

    const gridFeed = feed;

  return (
    <div className="space-y-8">
      <PageHero
        badge="Vie du Campus ENSA Fès"
        title="Actualités & Événements"
        subtitle="Retrouvez au même endroit les annonces officielles, hackathons, forums entreprises, workshops et moments forts de l'ADEI."
        image="/images/hero-news.png"
      />

      {/* Unified Controls Bar: Toggle Tabs + Search + Category Chips */}
      <div className="space-y-4 rounded-3xl border border-zinc-200/80 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-900/80 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={activeTab} onValueChange={(v) => setTab(String(v) as FeedTab)}>
            <TabsList className="h-11 rounded-xl p-1">
              <TabsTrigger value="all" className="gap-1.5 rounded-lg px-4">
                <Layers className="h-3.5 w-3.5" /> Tout ({allNews.length + allEvents.length})
              </TabsTrigger>
              <TabsTrigger value="news" className="gap-1.5 rounded-lg px-4">
                <Newspaper className="h-3.5 w-3.5" /> Actualités ({allNews.length})
              </TabsTrigger>
              <TabsTrigger value="events" className="gap-1.5 rounded-lg px-4">
                <CalendarDays className="h-3.5 w-3.5" /> Événements ({allEvents.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une actu, un événement ou un lieu…"
              className="h-10 rounded-xl pl-9"
            />
          </div>
        </div>

        {/* Period Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200/70 pt-3.5 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Période :
            </span>
            {[
              { id: 'all', label: 'Tous' },
              { id: 'upcoming', label: 'À venir' },
              { id: 'past', label: 'Archives' }
            ].map((tab) => {
              const active = timeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTimeFilter(tab.id as 'all' | 'upcoming' | 'past')}
                  className={`cursor-pointer rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    active
                      ? tab.id === 'past'
                        ? 'bg-zinc-700 text-white shadow-sm dark:bg-zinc-300 dark:text-zinc-950'
                        : 'bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-950'
                      : tab.id === 'past'
                        ? 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-700'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-semibold">
            {timeFilter === 'past' ? (
              <Archive className="h-3.5 w-3.5 text-zinc-500" />
            ) : (
              <CalendarDays className="h-3.5 w-3.5 text-red-600" />
            )}
            {feed.length} {feed.length === 1 ? 'résultat' : 'résultats'}
          </Badge>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <CardSkeletonGrid count={6} />
      ) : feed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white/60 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <Newspaper className="mb-3 h-10 w-10 text-zinc-400" />
          <p className="text-base font-semibold">Aucun contenu trouvé</p>
          <p className="mt-1 text-sm text-zinc-500">Essayez un autre filtre ou mot-clé.</p>
          {(search || timeFilter !== 'all' || activeTab !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearch('');
                setTimeFilter('all');
                setTab('all');
              }}
            >
              Tout afficher
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">


          {/* Unified Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {gridFeed.map((entry, idx) => {
              if (entry.kind === 'event') {
                const ev = entry.item;
                const isPast = checkIsPast(ev.date, ev.time);
                const countdown = !isPast ? getEventCountdown(ev.date, ev.time) : null;
                const badge = formatDateBadge(ev.date);
                return (
                  <motion.article
                    key={`event-${ev.id}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.25) }}
                    onClick={() => setSelectedEvent(ev)}
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
                        ) : countdown ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-zinc-950/85 px-3 py-1 text-[11px] font-semibold text-white shadow-md backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                            </span>
                            {countdown}
                          </span>
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
                        {ev.category && (
                          <span className="rounded-full bg-black/50 px-2.5 py-0.5 backdrop-blur">
                            {ev.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h3 className={`text-lg font-bold leading-snug transition ${isPast ? 'text-zinc-700 group-hover:text-zinc-950 dark:text-zinc-300 dark:group-hover:text-white' : 'group-hover:text-red-600'}`}>
                        {ev.title}
                      </h3>
                      <p className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold ${isPast ? 'text-zinc-500 dark:text-zinc-400' : 'text-red-600 dark:text-red-400'}`}>
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </p>
                      <p className="mt-2.5 line-clamp-3 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {ev.description}
                      </p>
                      <Separator className="my-4" />
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className={`inline-flex items-center gap-1 transition ${isPast ? 'text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-200' : 'text-red-600 group-hover:translate-x-0.5'}`}>
                          {isPast ? "Consulter l'archive" : 'Détails & inscription'} <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                        <div className="flex items-center gap-2">
                          {ev.registrationsCount !== undefined && ev.registrationsCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400">
                              <Users className="h-3 w-3" /> {ev.registrationsCount}
                            </span>
                          )}
                          {ev.organizer && <span className="truncate text-zinc-400">{ev.organizer}</span>}
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              }

              const news = entry.item;
              const isNewsArchived = checkIsPast(news.date);
              return (
                <motion.article
                  key={`news-${news.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.25) }}
                  onClick={() => setSelectedNews(news)}
                  className={`group flex cursor-pointer flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    isNewsArchived
                      ? 'border-zinc-300/80 bg-zinc-100/75 opacity-70 grayscale-[85%] hover:opacity-100 hover:grayscale-0 hover:bg-white dark:border-zinc-800/60 dark:bg-zinc-900/50 dark:hover:bg-zinc-900'
                      : 'border-zinc-200/80 bg-white shadow-sm hover:border-red-500/50 dark:border-zinc-800/80 dark:bg-zinc-900/90'
                  }`}
                >
                  <div className="relative h-48 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <img
                      src={news.image ? getImageUrl(news.image) : '/images/default.jpg'}
                      alt={news.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 flex items-center gap-1.5">
                      <Badge className="bg-zinc-950/75 text-white backdrop-blur">
                        {news.category || 'ADEI'}
                      </Badge>
                    </div>
                    <div className="absolute right-3 top-3">
                      {isNewsArchived ? (
                        <Badge variant="secondary" className="gap-1 border border-zinc-700/60 bg-zinc-950/85 text-zinc-300 backdrop-blur shadow">
                          <Archive className="h-3 w-3 text-zinc-400" /> Archivé
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 bg-white/90 text-zinc-900 backdrop-blur dark:bg-zinc-900/90 dark:text-zinc-100">
                          <Newspaper className="h-3 w-3 text-red-600" /> Actualité
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
                      <Calendar className={`h-3.5 w-3.5 ${isNewsArchived ? 'text-zinc-400' : 'text-red-500'}`} />
                      <span>{news.date}</span>
                      {news.organizer && <span className="truncate">· {news.organizer}</span>}
                    </div>
                    <h3 className={`text-lg font-bold leading-snug transition ${isNewsArchived ? 'text-zinc-700 group-hover:text-zinc-950 dark:text-zinc-300 dark:group-hover:text-white' : 'group-hover:text-red-600'}`}>
                      {news.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {news.content}
                    </p>
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className={`inline-flex items-center gap-1 transition ${isNewsArchived ? 'text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-200' : 'text-red-600 group-hover:translate-x-0.5'}`}>
                        Lire la suite <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                      <div className="flex items-center gap-2 text-zinc-400">
                        {news.document && <FileText className="h-3.5 w-3.5" />}
                        {news.link && <ExternalLink className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      )}

      {/* News Detail Modal */}
      <Modal open={Boolean(selectedNews)} onClose={() => setSelectedNews(null)} title={selectedNews?.title || ''}>
        {selectedNews && (
          <div className="space-y-5">
            {selectedNews.image && (
              <img
                src={getImageUrl(selectedNews.image)}
                alt={selectedNews.title}
                className="max-h-72 w-full rounded-xl object-cover"
              />
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <Badge className="bg-red-500/10 text-red-600 dark:text-red-400">
                {selectedNews.category || 'Actualité'}
              </Badge>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> {selectedNews.date}
              </span>
              {selectedNews.organizer && <span>· {selectedNews.organizer}</span>}
            </div>
            <Separator />
            <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {selectedNews.content}
            </p>
            {(selectedNews.document || selectedNews.link) && (
              <div className="flex flex-wrap gap-3 pt-2">
                {selectedNews.document && (
                  <a
                    href={getImageUrl(selectedNews.document)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700"
                  >
                    <FileText className="h-4 w-4" /> Télécharger le document
                  </a>
                )}
                {selectedNews.link && (
                  <a
                    href={selectedNews.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2.5 text-xs font-semibold transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    <ExternalLink className="h-4 w-4" /> Ouvrir le lien externe
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Event Detail Modal */}
      <Modal open={Boolean(selectedEvent)} onClose={() => setSelectedEvent(null)} title={selectedEvent?.title || ''}>
        {selectedEvent && (
          <div className="space-y-5">
            {selectedEvent.image && (
              <img
                src={getImageUrl(selectedEvent.image)}
                alt={selectedEvent.title}
                className="max-h-72 w-full rounded-xl object-cover"
              />
            )}
            {selectedEvent.date && checkIsPast(selectedEvent.date, selectedEvent.time) && (
              <div className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-100/90 px-3.5 py-2.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-400">
                <Archive className="h-4 w-4 shrink-0 text-zinc-500" />
                <span>Cet événement est passé et fait partie des archives du campus.</span>
              </div>
            )}
            <div className="grid gap-2.5 rounded-2xl bg-zinc-50 p-4 text-xs dark:bg-zinc-800/60 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-red-600" />
                <span className="font-semibold">{selectedEvent.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-600" />
                <span className="font-semibold">{selectedEvent.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-600" />
                <span className="font-semibold">{selectedEvent.location}</span>
              </div>
              {selectedEvent.organizer && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-red-600" />
                  <span className="font-semibold">{selectedEvent.organizer}</span>
                </div>
              )}
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {selectedEvent.description}
            </p>

            {/* Section Billetterie & Inscription */}
            {selectedEvent.date && checkIsPast(selectedEvent.date, selectedEvent.time) ? (
              <div className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Participation</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {selectedEvent.registrationsCount || 0} participant(s) ont assisté à cet événement.
                  </p>
                </div>
                <span className="rounded-xl bg-zinc-200/70 px-3.5 py-2 text-xs font-medium text-zinc-500 dark:bg-zinc-800">
                  Inscriptions clôturées
                </span>
              </div>
            ) : user ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Participation &amp; Inscription
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {selectedEvent.registrationsCount || 0} étudiant(s) ont déjà réservé leur place.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => registerMutation.mutate(selectedEvent.id)}
                  disabled={registerMutation.isPending}
                  className={selectedEvent.isRegistered
                    ? "h-10 gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700"
                    : "h-10 gap-1.5 rounded-xl bg-red-600 px-4 text-xs font-bold text-white hover:bg-red-700"
                  }
                >
                  {registerMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : selectedEvent.isRegistered ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Inscrit(e) ✓ (Annuler)
                    </>
                  ) : (
                    <>
                      <Ticket className="h-4 w-4" /> S'inscrire à l'événement
                    </>
                  )}
                </Button>
              </div>
            ) : guestRegisteredEvents.includes(selectedEvent.id) ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Votre inscription a bien été enregistrée !</span>
                </div>
                <p className="mt-1 text-xs">
                  Vos coordonnées ont été transmises aux organisateurs de l'événement.
                </p>
              </div>
            ) : (
              <div className="space-y-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-200/60 pb-3 dark:border-zinc-700/60">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Participation &amp; Inscription
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {selectedEvent.registrationsCount || 0} participant(s) déjà inscrit(s).
                    </p>
                  </div>
                  <Link
                    to={`/login?redirect=/news?tab=events`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-red-600 px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 shrink-0 self-start sm:self-auto"
                  >
                    <Ticket className="h-3.5 w-3.5" /> Se connecter pour s'inscrire en 1 clic
                  </Link>
                </div>

                <div className="space-y-3 pt-1">
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Ou remplissez vos coordonnées ci-dessous pour vous inscrire sans compte :
                  </p>

                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">Nom &amp; Prénom *</label>
                      <Input
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Ex: Mohammed Amine"
                        className="h-9 rounded-xl text-xs bg-white dark:bg-zinc-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">Adresse Email *</label>
                      <Input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="etudiant@usmba.ac.ma"
                        className="h-9 rounded-xl text-xs bg-white dark:bg-zinc-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">Numéro de téléphone *</label>
                      <Input
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="06 12 34 56 78"
                        className="h-9 rounded-xl text-xs bg-white dark:bg-zinc-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">Filière / Niveau *</label>
                      <select
                        value={guestFiliere}
                        onChange={(e) => setGuestFiliere(e.target.value)}
                        className="w-full h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        <option value="CP 1">Cycle Préparatoire — CP 1</option>
                        <option value="CP 2">Cycle Préparatoire — CP 2</option>
                        <option value="Génie Informatique">Génie Informatique (GI)</option>
                        <option value="Génie Télécom & Réseaux">Génie Télécom &amp; Réseaux (GTR)</option>
                        <option value="Génie Industriel">Génie Industriel (GIND)</option>
                        <option value="Génie Procédés & Environnement">Génie des Procédés (GCP)</option>
                        <option value="Génie Énergétique">Génie Énergétique (GE)</option>
                        <option value="Génie Mécanique">Génie Mécanique (GSM)</option>
                        <option value="Autre / Invité">Autre / Invité extérieur</option>
                      </select>
                    </div>

                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          id="guest-cndp-consent"
                          checked={guestConsent}
                          onChange={(e) => setGuestConsent(e.target.checked)}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-300 text-red-600 focus:ring-red-500 cursor-pointer"
                        />
                        <label htmlFor="guest-cndp-consent" className="text-[11px] leading-tight text-zinc-600 dark:text-zinc-400 select-none cursor-pointer">
                          J'accepte le traitement de mes coordonnées pour la gestion de cet événement (Loi 09-08).
                        </label>
                      </div>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal pl-5">
                        Conformément à la loi 09-08, les données sont collectées à usage exclusif de l'émargement et de l'organisation par l'ADEI et le club hôte, sans cession à des tiers.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="button"
                      disabled={guestRegisterMutation.isPending || !guestName.trim() || !guestEmail.trim() || !guestPhone.trim() || !guestConsent}
                      onClick={() => {
                        if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
                          toast.error('Veuillez renseigner votre nom, email et téléphone.');
                          return;
                        }
                        if (!guestConsent) {
                          toast.error('Veuillez accepter la mention relative à la protection des données (Loi 09-08).');
                          return;
                        }
                        guestRegisterMutation.mutate({
                          eventId: selectedEvent.id,
                          data: {
                            guestName: guestName.trim(),
                            guestEmail: guestEmail.trim(),
                            guestPhone: guestPhone.trim(),
                            guestFiliere: guestFiliere.trim()
                          }
                        });
                      }}
                      className="h-9 gap-1.5 rounded-xl bg-red-600 px-4 text-xs font-bold text-white hover:bg-red-700"
                    >
                      {guestRegisterMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Ticket className="h-3.5 w-3.5" /> Valider mon inscription
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={getGoogleCalendarUrl(selectedEvent)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
              >
                <CalendarPlus className="h-4 w-4 text-red-600" />
                Ajouter à Google Agenda
              </a>
              {selectedEvent.link && (
                <a
                  href={selectedEvent.link}
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
