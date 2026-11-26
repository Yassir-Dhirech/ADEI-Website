import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Newspaper,
  CalendarDays,
  Users,
  GraduationCap,
  Handshake,
  Shield,
  Award,
  UserCog,
  MessageSquareCheck,
  History,
  ArrowLeft
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const NAV_GROUPS = [
  {
    label: 'Général',
    items: [
      { to: '/admin', label: 'Vue d’ensemble', icon: LayoutDashboard, end: true },
      { to: '/admin/feedbacks', label: 'Modération', icon: MessageSquareCheck, end: false }
    ]
  },
  {
    label: 'Contenu & Vie Étudiante',
    items: [
      { to: '/admin/news', label: 'Actualités', icon: Newspaper, end: false },
      { to: '/admin/events', label: 'Événements', icon: CalendarDays, end: false },
      { to: '/admin/clubs', label: 'Clubs', icon: Users, end: false },
      { to: '/admin/filieres', label: 'Filières', icon: GraduationCap, end: false },
      { to: '/admin/partners', label: 'Partenaires', icon: Handshake, end: false }
    ]
  },
  {
    label: 'Organisation & Accès',
    items: [
      { to: '/admin/adei-members', label: 'Membres ADEI', icon: Shield, end: false },
      { to: '/admin/adei-roles', label: 'Rôles ADEI', icon: Award, end: false },
      { to: '/admin/users', label: 'Utilisateurs', icon: UserCog, end: false },
      { to: '/admin/audit-logs', label: 'Journal d’Audit', icon: History, end: false }
    ]
  }
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export function AdminLayout() {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Mobile Horizontal Nav */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
        {ALL_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'border border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                }`
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </NavLink>
          );
        })}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:col-span-3 lg:block">
        <div className="sticky top-24 rounded-3xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/90">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-tight">ADEI Console</p>
              <p className="text-[11px] text-zinc-500">Administration</p>
            </div>
          </div>

          <Separator className="my-3.5" />

          <nav className="space-y-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="space-y-1">
                <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                          isActive
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-white'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>

          <Separator className="my-4" />

          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Retour au site public
          </Link>
        </div>
      </aside>

      {/* Main Admin Workspace */}
      <div className="min-w-0 lg:col-span-9">
        <Outlet />
      </div>
    </div>
  );
}
