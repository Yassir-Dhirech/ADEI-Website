import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Loader2,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest, getImageUrl } from '@/lib/api';
import type { EventItem } from '@/types/api';
import { Modal } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all';

export function EventsAdminPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [search, setSearch] = useState('');

  // Modal de rejet avec motif
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetEventId, setTargetEventId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Récupération de tous les événements avec détails de modération
  const { data: eventsRes, isLoading } = useQuery({
    queryKey: ['admin', 'events', 'moderation'],
    queryFn: () => apiRequest<EventItem[]>('/events/moderation')
  });

  const events = eventsRes?.data || [];

  const counts = useMemo(() => {
    return {
      pending: events.filter((e) => e.status === 'pending').length,
      approved: events.filter((e) => e.status === 'approved').length,
      rejected: events.filter((e) => e.status === 'rejected').length,
      all: events.length
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      const matchesStatus = statusFilter === 'all' || (e.status || 'approved') === statusFilter;
      const matchesSearch =
        !q ||
        `${e.title} ${e.organizer ?? ''} ${e.location} ${e.category ?? ''}`
          .toLowerCase()
          .includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [events, statusFilter, search]);

  // Mutation changement de statut (Approuver / Rejeter)
  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      reason
    }: {
      id: number;
      status: 'approved' | 'rejected';
      reason?: string;
    }) => {
      return apiRequest(`/events/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionReason: reason })
      });
    },
    onSuccess: (_, vars) => {
      toast.success(
        vars.status === 'approved'
          ? "Événement approuvé et publié en ligne ! Email envoyé au président."
          : "Événement refusé. Email envoyé au président."
      );
      setRejectModalOpen(false);
      setTargetEventId(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'events', 'moderation'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du statut');
    }
  });

  const handleApprove = (id: number) => {
    statusMutation.mutate({ id, status: 'approved' });
  };

  const handleOpenReject = (id: number) => {
    setTargetEventId(id);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEventId) return;
    statusMutation.mutate({ id: targetEventId, status: 'rejected', reason: rejectionReason });
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Modération &amp; Événements</h1>
        <p className="text-xs text-zinc-500">
          Validez les propositions d'événements soumises par les clubs de l'ENSA Fès. Une confirmation automatique par email sera envoyée au président.
        </p>
      </div>

      {/* Barre de filtre & recherche */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList className="h-10 rounded-xl p-1">
            <TabsTrigger value="pending" className="gap-1.5 rounded-lg px-3 text-xs">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              En attente ({counts.pending})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-1.5 rounded-lg px-3 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              En ligne ({counts.approved})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-1.5 rounded-lg px-3 text-xs">
              <XCircle className="h-3.5 w-3.5 text-rose-500" />
              Refusés ({counts.rejected})
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg px-3 text-xs">
              Tous ({counts.all})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre, club, lieu..."
            className="h-10 rounded-xl pl-9 text-xs"
          />
        </div>
      </div>

      {/* Liste des événements */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-red-600" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
          <CalendarDays className="mx-auto h-9 w-9 text-zinc-400" />
          <h3 className="mt-3 text-sm font-bold">Aucun événement dans cet onglet</h3>
          <p className="mt-1 text-xs text-zinc-500">Toutes les demandes de cet état ont été traitées.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div>
                <div className="relative h-40 bg-zinc-900">
                  <img
                    src={ev.image ? getImageUrl(ev.image) : '/images/default.jpg'}
                    alt={ev.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute right-3 top-3">
                    {ev.status === 'pending' && (
                      <Badge className="border border-amber-500/40 bg-amber-500 text-[11px] font-bold text-white shadow">
                        En attente
                      </Badge>
                    )}
                    {ev.status === 'approved' && (
                      <Badge className="border border-emerald-500/40 bg-emerald-600 text-[11px] font-bold text-white shadow">
                        En ligne
                      </Badge>
                    )}
                    {ev.status === 'rejected' && (
                      <Badge className="border border-rose-500/40 bg-rose-600 text-[11px] font-bold text-white shadow">
                        Refusé
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500">
                    <span>{ev.date} à {ev.time}</span>
                    <span className="text-red-600">{ev.organizer || 'Club'}</span>
                  </div>
                  <h3 className="mt-1 font-bold leading-snug">{ev.title}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                    <MapPin className="h-3 w-3" /> {ev.location}
                  </p>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {ev.description}
                  </p>

                  {ev.submitter && (
                    <div className="mt-3 rounded-xl bg-zinc-50 p-2.5 text-[11px] text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
                      <p className="font-semibold">Soumis par : {ev.submitter.username}</p>
                      <p className="text-zinc-400">{ev.submitter.email}</p>
                    </div>
                  )}

                  {ev.status === 'rejected' && ev.rejectionReason && (
                    <p className="mt-2 text-xs font-medium text-rose-600">
                      Motif : {ev.rejectionReason}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions de modération 1-clic */}
              <div className="flex items-center gap-2 border-t border-zinc-100 p-3 dark:border-zinc-800">
                {ev.status !== 'approved' && (
                  <Button
                    onClick={() => handleApprove(ev.id)}
                    disabled={statusMutation.isPending}
                    className="h-9 flex-1 gap-1.5 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approuver
                  </Button>
                )}
                {ev.status !== 'rejected' && (
                  <Button
                    onClick={() => handleOpenReject(ev.id)}
                    disabled={statusMutation.isPending}
                    variant="outline"
                    className="h-9 flex-1 gap-1.5 rounded-xl border-rose-300 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/30"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Refuser
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de motif de refus */}
      <Modal open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Refuser la proposition d'événement">
        <form onSubmit={handleConfirmReject} className="space-y-4 pt-2">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Veuillez indiquer le motif du refus. Cette explication sera transmise par email officiel au président du club pour lui permettre de corriger sa demande.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Motif du refus (optionnel mais recommandé)</label>
            <Input
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ex: Conflit de salle avec l'Amphi A / Date coïncidant avec les examens"
              className="h-10 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setRejectModalOpen(false)} className="h-10 rounded-xl text-xs">
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={statusMutation.isPending}
              className="h-10 gap-2 rounded-xl bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700"
            >
              {statusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Confirmer le refus
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
