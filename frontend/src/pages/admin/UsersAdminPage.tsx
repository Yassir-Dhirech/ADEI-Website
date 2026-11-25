import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  GraduationCap,
  Phone,
  Mail,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import type { User } from '@/types/api';
import { CardSkeletonGrid } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type StatusFilter = 'pending' | 'active' | 'rejected' | 'all';

export function UsersAdminPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => apiRequest<User[]>('/users')
  });

  const users = data?.data ?? [];

  // Mutation pour activer / rejeter un compte
  const statusMutation = useMutation({
    mutationFn: ({ id, status, is_president, is_representant }: { id: number; status: 'active' | 'rejected' | 'pending'; is_president?: boolean; is_representant?: boolean }) =>
      apiRequest(`/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, is_president, is_representant })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  });

  const counts = useMemo(() => {
    return {
      pending: users.filter((u) => u.status === 'pending').length,
      active: users.filter((u) => u.status === 'active').length,
      rejected: users.filter((u) => u.status === 'rejected').length,
      all: users.length
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesStatus = statusFilter === 'all' || (u.status || 'pending') === statusFilter;
      const matchesSearch =
        !q ||
        `${u.username} ${u.email} ${u.filiere ?? ''} ${u.classe ?? ''} ${u.phone ?? ''}`
          .toLowerCase()
          .includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [users, statusFilter, search]);

  const handleStatusChange = (id: number, status: 'active' | 'rejected', requestedRole?: string) => {
    const is_president = requestedRole === 'president';
    const is_representant = requestedRole === 'delegue';
    statusMutation.mutate({ id, status, is_president, is_representant });
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Validation des Comptes Étudiants</h1>
          <p className="text-xs text-zinc-500">
            Gérez les demandes d'accès des élèves-ingénieurs, présidents de clubs et délégués ENSA Fès.
          </p>
        </div>
      </div>

      {/* Barre de contrôle : Onglets & Recherche */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/80 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList className="h-10 rounded-xl p-1">
            <TabsTrigger value="pending" className="gap-1.5 rounded-lg px-3 text-xs">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              En attente ({counts.pending})
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-1.5 rounded-lg px-3 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Actifs ({counts.active})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-1.5 rounded-lg px-3 text-xs">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              Refusés ({counts.rejected})
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-1.5 rounded-lg px-3 text-xs">
              Tous ({counts.all})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, filière…"
            className="h-10 rounded-xl pl-9 text-xs"
          />
        </div>
      </div>

      {/* Liste des utilisateurs */}
      {isLoading ? (
        <CardSkeletonGrid count={6} />
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white/50 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <Users className="mb-3 h-10 w-10 text-zinc-400" />
          <p className="text-base font-semibold">Aucun utilisateur trouvé</p>
          <p className="mt-1 text-xs text-zinc-500">Aucune demande ne correspond à vos filtres actuels.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredUsers.map((u) => {
              const isPending = (u.status || 'pending') === 'pending';
              const isActive = u.status === 'active';
              const isRejected = u.status === 'rejected';

              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/90"
                >
                  <div className="space-y-3">
                    {/* Header : Nom & Badge statut */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold leading-tight text-zinc-900 dark:text-zinc-100">
                          {u.username}
                        </h3>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-zinc-500">
                          <Mail className="h-3 w-3 text-zinc-400" />
                          <span className="truncate">{u.email}</span>
                        </p>
                      </div>

                      {isPending && (
                        <Badge variant="secondary" className="gap-1 border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 text-[10px]">
                          <Clock className="h-3 w-3" /> En attente
                        </Badge>
                      )}
                      {isActive && (
                        <Badge variant="secondary" className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" /> Actif
                        </Badge>
                      )}
                      {isRejected && (
                        <Badge variant="secondary" className="gap-1 border-red-300 bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 text-[10px]">
                          <XCircle className="h-3 w-3" /> Refusé
                        </Badge>
                      )}
                    </div>

                    {/* Rôle Sollicité */}
                    {u.requested_role && u.requested_role !== 'user' && (
                      <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/70 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/50">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          Rôle sollicité :
                        </span>
                        <p className="mt-0.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {u.requested_role === 'president' && 'Président de Club Étudiant'}
                          {u.requested_role === 'delegue' && 'Délégué / Représentant de Filière'}
                          {u.requested_role === 'alumni' && 'Lauréat / Ancien élève (Alumni)'}
                        </p>
                      </div>
                    )}

                    {/* Données de scolarité */}
                    <div className="space-y-1.5 border-t border-zinc-100 pt-3 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                      {(u.filiere || u.classe) && (
                        <p className="inline-flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5 text-zinc-400" />
                          <span>{u.filiere || 'Filière non renseignée'} {u.classe ? `(${u.classe})` : ''}</span>
                        </p>
                      )}
                      {u.phone && (
                        <p className="inline-flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-zinc-400" />
                          <span>{u.phone}</span>
                        </p>
                      )}
                      {u.role === 'admin' && (
                        <p className="inline-flex items-center gap-1.5 font-semibold text-red-600">
                          <Shield className="h-3.5 w-3.5" />
                          <span>Administrateur Système</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions 1-clic */}
                  <div className="mt-5 flex items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    {isPending ? (
                      <>
                        <Button
                          size="sm"
                          className="flex-1 gap-1.5 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                          disabled={statusMutation.isPending}
                          onClick={() => handleStatusChange(u.id, 'active', u.requested_role)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 border-zinc-200 text-xs text-red-600 hover:bg-red-50 dark:border-zinc-800 dark:hover:bg-red-950/30"
                          disabled={statusMutation.isPending}
                          onClick={() => handleStatusChange(u.id, 'rejected')}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Refuser
                        </Button>
                      </>
                    ) : (
                      <>
                        {isActive ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full gap-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            disabled={statusMutation.isPending}
                            onClick={() => handleStatusChange(u.id, 'rejected')}
                          >
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Suspendre l'accès
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full gap-1.5 bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
                            disabled={statusMutation.isPending}
                            onClick={() => handleStatusChange(u.id, 'active', u.requested_role)}
                          >
                            <UserCheck className="h-3.5 w-3.5" /> Réactiver le compte
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}