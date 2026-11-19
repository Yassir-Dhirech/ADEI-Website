import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Newspaper,
  CalendarDays,
  Users,
  GraduationCap,
  Handshake,
  Shield,
  Award,
  UserCog,
  MessageSquareCheck,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';

const SECTIONS = [
  { key: 'news', label: 'Actualités', desc: 'Articles & communiqués', endpoint: '/news', to: '/admin/news', icon: Newspaper },
  { key: 'events', label: 'Événements', desc: 'Agenda & workshops', endpoint: '/events', to: '/admin/events', icon: CalendarDays },
  { key: 'clubs', label: 'Clubs', desc: 'Associations étudiantes', endpoint: '/clubs', to: '/admin/clubs', icon: Users },
  { key: 'filieres', label: 'Filières', desc: 'Formations ENSA Fès', endpoint: '/filieres', to: '/admin/filieres', icon: GraduationCap },
  { key: 'partners', label: 'Partenaires', desc: 'Sponsors & institutions', endpoint: '/partners', to: '/admin/partners', icon: Handshake },
  { key: 'members', label: 'Membres ADEI', desc: 'Bureau exécutif', endpoint: '/adei-members', to: '/admin/adei-members', icon: Shield },
  { key: 'roles', label: 'Rôles ADEI', desc: 'Hiérarchie des postes', endpoint: '/adei-roles', to: '/admin/adei-roles', icon: Award },
  { key: 'users', label: 'Utilisateurs', desc: 'Comptes enregistrés', endpoint: '/users', to: '/admin/users', icon: UserCog },
  { key: 'feedbacks', label: 'Feedbacks', desc: 'Modération boîte à idées', endpoint: '/feedbacks', to: '/admin/feedbacks', icon: MessageSquareCheck }
];

export function AdminDashboardPage() {
  const { user } = useAuth();

  const { data: counts = {}, isLoading } = useQuery({
    queryKey: ['admin', 'counts'],
    queryFn: async () => {
      const results = await Promise.all(
        SECTIONS.map(async (s) => {
          try {
            const res = await apiRequest<unknown[]>(s.endpoint);
            return [s.key, res.meta?.total ?? res.data.length] as const;
          } catch {
            return [s.key, 0] as const;
          }
        })
      );
      return Object.fromEntries(results) as Record<string, number>;
    }
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-zinc-950 p-6 text-white shadow-md dark:border-zinc-800 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-red-600/25 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge className="mb-2 bg-red-500/20 text-red-200 border border-red-400/30">
              Espace Administrateur
            </Badge>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Bonjour, {user?.username || 'Admin'}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Pilotez le contenu, les clubs et la modération du portail ADEI ENSA Fès.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/news"
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              <Plus className="h-4 w-4" /> Gérer les actualités
            </Link>
            <Link
              to="/admin/feedbacks"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
            >
              <MessageSquareCheck className="h-4 w-4" /> Modérer
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Section Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((s, idx) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.03, 0.25) }}
            >
              <Link
                to={s.to}
                className="group flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-500/60 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/90"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600 transition group-hover:bg-red-600 group-hover:text-white dark:text-red-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-red-600" />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-extrabold tracking-tight">
                    {isLoading ? '…' : counts[s.key] ?? 0}
                  </p>
                  <p className="mt-1 text-sm font-bold">{s.label}</p>
                  <p className="text-xs text-zinc-500">{s.desc}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
