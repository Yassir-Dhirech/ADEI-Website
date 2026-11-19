import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Calendar,
  MapPin,
  Newspaper,
  Users,
  GraduationCap,
  Sparkles,
  MessageSquareHeart,
  ExternalLink,
  FileText
} from 'lucide-react';
import { apiRequest, getImageUrl } from '@/lib/api';
import type { NewsItem, EventItem, ClubItem, FiliereItem } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal, CardSkeletonGrid } from '@/components/ui';

export function HomePage() {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const newsQuery = useQuery({ queryKey: ['news', 1, 4], queryFn: () => apiRequest<NewsItem[]>('/news?page=1&limit=4') });
  const eventsQuery = useQuery({ queryKey: ['events', 1, 4], queryFn: () => apiRequest<EventItem[]>('/events?page=1&limit=4') });
  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: () => apiRequest<ClubItem[]>('/clubs') });
  const filieresQuery = useQuery({ queryKey: ['filieres'], queryFn: () => apiRequest<FiliereItem[]>('/filieres') });

  const newsList = newsQuery.data?.data ?? [];
  const featuredNews = newsList[0] ?? null;
  const secondaryNews = newsList.slice(1, 4);
  const eventsList = eventsQuery.data?.data ?? [];
  const clubsList = (clubsQuery.data?.data ?? []).slice(0, 6);

  const stats = [
    { label: 'Filières & CP', value: filieresQuery.data?.data.length ?? 0, icon: GraduationCap, to: '/ensa' },
    { label: 'Clubs Étudiants', value: clubsQuery.data?.data.length ?? 0, icon: Users, to: '/clubs' },
    { label: 'Actualités', value: newsQuery.data?.meta?.total ?? newsList.length, icon: Newspaper, to: '/news' },
    { label: 'Événements', value: eventsQuery.data?.meta?.total ?? eventsList.length, icon: Calendar, to: '/events' }
  ];

  return (
    <div className="space-y-14">
      {/* Cinematic Spotlight Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-[2rem] border border-zinc-200/60 bg-zinc-950 px-6 py-16 text-white shadow-2xl sm:px-14 sm:py-24 dark:border-zinc-800"
      >
        <img
          src="/images/hero-home.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/90 via-zinc-950/85 to-black/95" />
        {/* Animated Spotlight Halo */}
        <motion.div
          aria-hidden="true"
          animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-red-600/35 blur-3xl"
        />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/15 px-4 py-1.5 text-xs font-semibold text-red-200 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Association Officielle des Étudiants Ingénieurs · ENSA Fès
          </div>

          <h1 className="bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-6xl">
            Vivez pleinement l&apos;expérience <span className="text-red-500">ENSA Fès</span>.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            Clubs techniques, conférences, compétitions, drives académiques et représentation étudiante — toute la vie du campus réunie dans un seul portail moderne.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/clubs">
              <Button className="h-11 rounded-xl bg-red-600 px-6 text-sm font-semibold text-white shadow-lg shadow-red-600/30 hover:bg-red-700">
                Découvrir les Clubs <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/ensa">
              <Button variant="outline" className="h-11 rounded-xl border-white/25 bg-white/10 px-6 text-sm font-semibold text-white hover:bg-white/20">
                Explorer les Filières
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Bento Grid: Featured News + Live Campus Pulse */}
      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-red-600">À la une</p>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Le Pouls du Campus</h2>
          </div>
          <Link to="/news" className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:underline">
            Toutes les actualités <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-12">
          {/* Big Featured Article Tile (7 cols) */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => featuredNews && setSelectedNews(featuredNews)}
            className="group relative flex min-h-[320px] cursor-pointer flex-col justify-end overflow-hidden rounded-3xl border border-zinc-200/80 bg-zinc-900 p-7 text-white shadow-lg lg:col-span-7 dark:border-zinc-800"
          >
            <img
              src={featuredNews?.image ? getImageUrl(featuredNews.image) : '/images/hero-news.png'}
              alt={featuredNews?.title || 'Actualités ADEI'}
              className="absolute inset-0 h-full w-full object-cover opacity-55 transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div className="relative z-10 space-y-2.5">
              <div className="flex items-center gap-2">
                <Badge className="bg-red-600 text-white hover:bg-red-600">{featuredNews?.category || 'À la une'}</Badge>
                {featuredNews && <span className="text-xs text-zinc-300">{featuredNews.date}</span>}
              </div>
              <h3 className="text-2xl font-extrabold leading-tight sm:text-3xl">
                {featuredNews ? featuredNews.title : 'Restez connecté aux dernières annonces de l’ADEI'}
              </h3>
              <p className="line-clamp-2 text-sm text-zinc-300">
                {featuredNews ? featuredNews.content : 'Les prochaines actualités, communiqués et événements majeurs apparaîtront ici dès leur publication.'}
              </p>
            </div>
          </motion.div>

          {/* Right Bento Stack (5 cols): 2x2 Animated Stats + Feedback CTA */}
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5">
            {stats.map((s, idx) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.07 }}
              >
                <Link
                  to={s.to}
                  className="group flex h-full flex-col justify-between rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-red-500/60 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-between">
                    <div className="rounded-2xl bg-red-500/10 p-2.5 text-red-600 dark:text-red-400">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-1 group-hover:text-red-600" />
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-black tracking-tight">{s.value}</p>
                    <p className="text-xs font-medium text-zinc-500">{s.label}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Secondary News Row */}
        {newsQuery.isLoading ? (
          <CardSkeletonGrid count={3} />
        ) : secondaryNews.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-3">
            {secondaryNews.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -3 }}
                onClick={() => setSelectedNews(item)}
                className="group cursor-pointer rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:border-red-500/50 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <Badge variant="secondary">{item.category || 'ADEI'}</Badge>
                  <span>{item.date}</span>
                </div>
                <h3 className="mt-3 font-bold group-hover:text-red-600">{item.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-sm text-zinc-500">{item.content}</p>
              </motion.div>
            ))}
          </div>
        ) : null}
      </section>

      {/* Events Timeline + Feedback Banner */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold tracking-tight">Prochains Événements</h2>
            <Link to="/events" className="text-sm font-semibold text-red-600 hover:underline">Calendrier complet →</Link>
          </div>
          {eventsList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-800">
              Aucun événement programmé pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {eventsList.map((ev) => (
                <motion.div
                  key={ev.id}
                  whileHover={{ x: 4 }}
                  onClick={() => setSelectedEvent(ev)}
                  className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition hover:border-red-500/50 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-red-600/10 text-red-600">
                      <Calendar className="h-5 w-5" />
                      <span className="mt-0.5 text-[10px] font-bold">{ev.date.slice(5)}</span>
                    </div>
                    <div>
                      <h3 className="font-bold">{ev.title}</h3>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span>⏰ {ev.time}</span>
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-red-600" /> {ev.location}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-red-600">Détails →</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Creative CTA Card */}
        <div className="flex flex-col justify-between rounded-3xl bg-gradient-to-br from-red-600 to-rose-900 p-7 text-white shadow-xl lg:col-span-4">
          <div className="space-y-3">
            <div className="inline-flex rounded-2xl bg-white/15 p-3">
              <MessageSquareHeart className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-extrabold leading-tight">Une idée pour votre école ?</h3>
            <p className="text-sm text-red-100">
              Votre voix compte. Partagez vos suggestions, retours ou projets directement avec le bureau de l&apos;ADEI.
            </p>
          </div>
          <Link to="/feedbacks" className="mt-6">
            <Button className="h-11 w-full rounded-xl bg-white font-semibold text-red-700 hover:bg-zinc-100">
              Ouvrir la Boîte à Idées <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Clubs Preview Strip */}
      {clubsList.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold tracking-tight">Clubs Étudiants</h2>
            <Link to="/clubs" className="text-sm font-semibold text-red-600 hover:underline">Voir tous les clubs →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubsList.map((club) => (
              <Link
                key={club.id}
                to="/clubs"
                className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 bg-white p-4 transition hover:border-red-500/50 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <img src={getImageUrl(club.image)} alt={club.club} className="h-12 w-12 rounded-xl object-cover" />
                <div className="min-w-0">
                  <p className="truncate font-bold">{club.club}</p>
                  <p className="truncate text-xs text-zinc-500">{club.president}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Detail Modals */}
      <Modal open={Boolean(selectedNews)} onClose={() => setSelectedNews(null)} title={selectedNews?.title || ''}>
        {selectedNews && (
          <div className="space-y-4">
            {selectedNews.image && <img src={getImageUrl(selectedNews.image)} alt={selectedNews.title} className="max-h-72 w-full rounded-xl object-cover" />}
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <Badge>{selectedNews.category || 'ADEI'}</Badge>
              <span>Publié le {selectedNews.date}</span>
              {selectedNews.organizer && <span>· Par {selectedNews.organizer}</span>}
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{selectedNews.content}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              {selectedNews.document && (
                <a href={getImageUrl(selectedNews.document)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white">
                  <FileText className="h-4 w-4" /> Télécharger le document
                </a>
              )}
              {selectedNews.link && (
                <a href={selectedNews.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold dark:border-zinc-700">
                  <ExternalLink className="h-4 w-4" /> Lien externe
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(selectedEvent)} onClose={() => setSelectedEvent(null)} title={selectedEvent?.title || ''}>
        {selectedEvent && (
          <div className="space-y-4">
            {selectedEvent.image && <img src={getImageUrl(selectedEvent.image)} alt={selectedEvent.title} className="max-h-72 w-full rounded-xl object-cover" />}
            <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
              <Badge>{selectedEvent.date}</Badge>
              <span>⏰ {selectedEvent.time}</span>
              <span>📍 {selectedEvent.location}</span>
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{selectedEvent.description}</p>
            {selectedEvent.link && (
              <a href={selectedEvent.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white">
                <ExternalLink className="h-4 w-4" /> S&apos;inscrire
              </a>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
