import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Mail,
  ExternalLink,
  Award,
  Handshake,
  Crown,
  History,
  Shield,
  Users,
  Settings2
} from 'lucide-react';
import { apiRequest, getImageUrl } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { AdeiMemberItem, PartnerItem } from '@/types/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageHero, CardSkeletonGrid } from '@/components/ui';

function getInitials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'AD'
  );
}

function classifyMember(m: AdeiMemberItem): 'presidency' | 'executive' | 'team' {
  const roleLower = m.role.toLowerCase();
  if (roleLower === 'president' || roleLower === 'vice president') return 'presidency';
  if (
    m.roleInfo?.tier === 1 ||
    /secrétaire|trésorier|conseiller/i.test(m.role)
  ) {
    return 'executive';
  }
  return 'team';
}

export function AdeiPage() {
  const { user } = useAuth();
  const membersQuery = useQuery({
    queryKey: ['adei-members'],
    queryFn: () => apiRequest<AdeiMemberItem[]>('/adei-members')
  });
  const partnersQuery = useQuery({
    queryKey: ['partners'],
    queryFn: () => apiRequest<PartnerItem[]>('/partners')
  });

  const members = membersQuery.data?.data ?? [];
  const partners = partnersQuery.data?.data ?? [];

  // Extract unique mandates sorted newest first (e.g. "2025/2026", "2024/2025", "2023/2024")
  const mandates = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => set.add(m.mandate || '2025/2026'));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [members]);

  const [selectedMandate, setSelectedMandate] = useState<string>('');
  const activeMandate =
    selectedMandate && mandates.includes(selectedMandate)
      ? selectedMandate
      : mandates[0] || '2025/2026';

  const currentMandate = mandates[0] || '2025/2026';

  const mandateMembers = useMemo(
    () => members.filter((m) => (m.mandate || '2025/2026') === activeMandate),
    [members, activeMandate]
  );

  const presidency = mandateMembers.filter((m) => classifyMember(m) === 'presidency');
  const executive = mandateMembers.filter((m) => classifyMember(m) === 'executive');
  const team = mandateMembers.filter((m) => classifyMember(m) === 'team');

  return (
    <div className="space-y-8">
      <PageHero
        badge="Bureau Exécutif & Historique"
        title="L'Équipe ADEI & Nos Partenaires"
        subtitle="Découvrez le bureau exécutif actuel, l'historique des anciens bureaux qui ont bâti l'ADEI ENSA Fès, ainsi que nos partenaires officiels."
        image="/images/hero-about.png"
      />

      <Tabs defaultValue="members" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList className="h-11 rounded-xl p-1">
            <TabsTrigger value="members" className="gap-2 rounded-lg px-5">
              <Award className="h-4 w-4" /> Bureaux ADEI ({mandates.length || 1})
            </TabsTrigger>
            <TabsTrigger value="partners" className="gap-2 rounded-lg px-5">
              <Handshake className="h-4 w-4" /> Partenaires ({partners.length})
            </TabsTrigger>
          </TabsList>

          {user?.role === 'admin' && (
            <Link
              to="/admin/adei-members"
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-600 hover:text-white dark:text-red-400"
            >
              <Settings2 className="h-3.5 w-3.5" /> Gérer les mandats (Admin)
            </Link>
          )}
        </div>

        <TabsContent value="members" className="space-y-8">
          {/* Mandate Year Switcher */}
          {mandates.length > 0 && (
            <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/80">
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-red-600" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                    Choisir un mandat
                  </h2>
                </div>
                <span className="text-xs text-zinc-500">
                  {mandateMembers.length} membre{mandateMembers.length > 1 ? 's' : ''} sur ce mandat
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {mandates.map((mandate) => {
                  const isSelected = mandate === activeMandate;
                  const isCurrent = mandate === currentMandate;
                  return (
                    <button
                      key={mandate}
                      type="button"
                      onClick={() => setSelectedMandate(mandate)}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${
                        isSelected
                          ? 'border-red-600 bg-red-600 text-white shadow-md shadow-red-600/20'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-red-400 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300'
                      }`}
                    >
                      <span>Bureau Exécutif {mandate}</span>
                      {isCurrent && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          Actuel
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {membersQuery.isLoading ? (
            <CardSkeletonGrid count={4} />
          ) : mandateMembers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 py-14 text-center text-sm text-zinc-500 dark:border-zinc-800">
              Aucun membre ADEI enregistré pour le moment.
            </div>
          ) : (
            <div className="space-y-10">
              {/* Mandate Title Header */}
              <div className="text-center">
                <Badge className="mb-2 bg-red-500/10 text-red-600 dark:text-red-400">
                  {activeMandate === currentMandate ? 'Mandat en cours' : 'Archive du Bureau'}
                </Badge>
                <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Bureau Exécutif — Année {activeMandate}
                </h2>
              </div>

              {/* TIER 1: PRÉSIDENCE */}
              {presidency.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-red-600">
                    <Crown className="h-4 w-4" /> Présidence
                  </div>
                  <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
                    {presidency.map((m, idx) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        whileHover={{ y: -4 }}
                        className="relative overflow-hidden rounded-3xl border border-red-500/35 bg-white shadow-md transition hover:shadow-xl dark:bg-zinc-900"
                      >
                        <div className="h-20 bg-gradient-to-r from-red-600 via-red-700 to-zinc-900" />
                        <div className="-mt-12 flex flex-col items-center px-6 pb-6 text-center">
                          <Avatar className="h-24 w-24 border-4 border-white shadow-lg dark:border-zinc-900">
                            {m.photo && <AvatarImage src={getImageUrl(m.photo)} alt={m.name} />}
                            <AvatarFallback className="bg-red-600 text-xl font-extrabold text-white">
                              {getInitials(m.name)}
                            </AvatarFallback>
                          </Avatar>
                          <h3 className="mt-3 text-lg font-extrabold">{m.name}</h3>
                          <Badge className="mt-1.5 bg-red-600 text-white">{m.role}</Badge>
                          <a
                            href={`mailto:${m.email}`}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-red-500/10 hover:text-red-600 dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            <Mail className="h-3.5 w-3.5" /> {m.email}
                          </a>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* TIER 2: SECRÉTARIAT & TRÉSORERIE */}
              {executive.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500">
                      <Shield className="h-3.5 w-3.5 text-red-600" /> Secrétariat, Trésorerie & Conseil
                    </span>
                    <Separator className="flex-1" />
                  </div>
                  <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {executive.map((m, idx) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.05, 0.2) }}
                        whileHover={{ y: -3 }}
                        className="flex flex-col items-center gap-3 rounded-3xl border border-zinc-200/80 bg-white p-6 text-center shadow-sm transition hover:border-red-500/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <Avatar className="h-20 w-20 border-2 border-red-500/30">
                          {m.photo && <AvatarImage src={getImageUrl(m.photo)} alt={m.name} />}
                          <AvatarFallback className="bg-red-500/10 text-base font-bold text-red-600 dark:text-red-400">
                            {getInitials(m.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-base font-extrabold">{m.name}</h3>
                          <Badge variant="secondary" className="mt-1.5 bg-red-500/10 text-red-600 dark:text-red-400">
                            {m.role}
                          </Badge>
                        </div>
                        <a
                          href={`mailto:${m.email}`}
                          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-600"
                        >
                          <Mail className="h-3.5 w-3.5" /> {m.email}
                        </a>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* TIER 3: PÔLES & RESPONSABLES */}
              {team.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500">
                      <Users className="h-3.5 w-3.5 text-red-600" /> Pôles & Responsables
                    </span>
                    <Separator className="flex-1" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {team.map((m, idx) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.04, 0.2) }}
                        whileHover={{ y: -3 }}
                        className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition hover:border-red-500/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <Avatar className="h-14 w-14 shrink-0 border border-zinc-200 dark:border-zinc-700">
                          {m.photo && <AvatarImage src={getImageUrl(m.photo)} alt={m.name} />}
                          <AvatarFallback className="bg-zinc-100 text-sm font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                            {getInitials(m.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-extrabold">{m.name}</h3>
                          <p className="truncate text-xs font-semibold text-red-600 dark:text-red-400">
                            {m.role}
                          </p>
                          <a
                            href={`mailto:${m.email}`}
                            className="mt-1 inline-flex items-center gap-1 truncate text-[11px] text-zinc-500 hover:text-red-600"
                          >
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{m.email}</span>
                          </a>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="partners">
          {partnersQuery.isLoading ? (
            <CardSkeletonGrid count={4} />
          ) : partners.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 py-14 text-center text-sm text-zinc-500 dark:border-zinc-800">
              Aucun partenaire affiché pour le moment.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {partners.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(idx * 0.04, 0.25) }}
                  whileHover={{ y: -4 }}
                  className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-zinc-200/80 bg-white p-6 text-center shadow-sm transition hover:border-red-500/50 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {p.logo && <img src={getImageUrl(p.logo)} alt={p.name} className="h-16 object-contain" />}
                  <div className="space-y-1">
                    <h3 className="font-extrabold">{p.name}</h3>
                    {p.description && <p className="line-clamp-2 text-xs text-zinc-500">{p.description}</p>}
                  </div>
                  {p.website && (
                    <a
                      href={p.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white"
                    >
                      Visiter <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
