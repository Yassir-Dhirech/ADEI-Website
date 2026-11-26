import { useState, useMemo, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Loader2,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Users,
  AlertCircle,
  Download,
  Mail,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest, getImageUrl } from '@/lib/api';
import type { EventItem, ClubItem } from '@/types/api';
import { Modal } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrganizersMultiSelect } from '@/components/common/OrganizersMultiSelect';
import { exportToCsv } from '@/lib/csv';

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all';

const CATEGORIES = [
  'Conférence',
  'Compétition',
  'Culture & Arts',
  'Sport & Tournois',
  'Forum Entreprises',
  'Atelier & Workshop',
  'Soirée & Intégration',
  'Autre'
];

export function EventsAdminPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  // Modale Création / Édition
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [selectedOrganizers, setSelectedOrganizers] = useState<string[]>(['ADEI']);
  const [eventForm, setEventForm] = useState({
    title: '',
    category: 'Conférence',
    date: '',
    time: '14:00',
    location: 'Amphi A — ENSA Fès',
    organizer: 'ADEI',
    clubId: '',
    link: '',
    description: ''
  });
  const [eventImage, setEventImage] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Modale de rejet avec motif
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetEventId, setTargetEventId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Modale de confirmation de suppression
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);

  // Modale Liste des Inscrits
  const [attendeesModalOpen, setAttendeesModalOpen] = useState(false);
  const [activeEventAttendees, setActiveEventAttendees] = useState<EventItem | null>(null);

  // 1. Récupération de tous les événements avec modération et inscrits
  const { data: eventsRes, isLoading } = useQuery({
    queryKey: ['admin', 'events', 'moderation'],
    queryFn: () => apiRequest<EventItem[]>('/events/moderation')
  });
  const events = eventsRes?.data || [];

  // 2. Récupération des clubs pour la sélection de l'organisateur
  const { data: clubsRes } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => apiRequest<ClubItem[]>('/clubs')
  });
  const clubs = clubsRes?.data || [];

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

  // Validation du formulaire de création / édition
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!eventForm.title.trim()) {
      errors.title = "Le titre de l'événement est obligatoire.";
    }
    if (!eventForm.date.trim()) {
      errors.date = 'La date est obligatoire.';
    }
    if (!eventForm.time.trim() || !/^([01]\d|2[0-3]):[0-5]\d$/.test(eventForm.time.trim())) {
      errors.time = "L'heure doit être au format HH:MM (ex: 14:00).";
    }
    if (!eventForm.location.trim()) {
      errors.location = 'Le lieu est obligatoire.';
    }
    if (!eventForm.description.trim()) {
      errors.description = 'La description est obligatoire.';
    }
    if (eventForm.link.trim() && !/^https?:\/\/.+/i.test(eventForm.link.trim())) {
      errors.link = "Le lien doit commencer par http:// ou https://";
    }
    return errors;
  };

  // Mutation Création / Mise à jour
  const saveMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('title', eventForm.title.trim());
      formData.append('category', eventForm.category.trim());
      formData.append('date', eventForm.date.trim());
      formData.append('time', eventForm.time.trim());
      formData.append('location', eventForm.location.trim());
      const orgString = selectedOrganizers.join(' • ') || 'ADEI';
      formData.append('organizer', orgString);
      formData.append('organizers', JSON.stringify(selectedOrganizers));
      const matchedClub = clubs.find((c) => selectedOrganizers.includes(c.club));
      if (matchedClub) {
        formData.append('clubId', String(matchedClub.id));
      }
      if (eventForm.link.trim()) formData.append('link', eventForm.link.trim());
      formData.append('description', eventForm.description.trim());
      if (eventImage) formData.append('image', eventImage);

      const endpoint = editingEvent ? `/events/${editingEvent.id}` : '/events';
      const method = editingEvent ? 'PUT' : 'POST';

      return apiRequest(endpoint, {
        method,
        body: formData
      });
    },
    onSuccess: () => {
      toast.success(
        editingEvent
          ? 'Événement modifié avec succès !'
          : 'Nouvel événement officiel créé et publié en ligne avec succès !'
      );
      setEventModalOpen(false);
      setEditingEvent(null);
      setEventImage(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'events', 'moderation'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    }
  });

  // Mutation Suppression
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/events/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast.success('Événement supprimé avec succès.');
      setDeleteModalOpen(false);
      setDeletingEventId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'events', 'moderation'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  });

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
          ? 'Événement approuvé et publié en ligne ! Notification envoyée au président.'
          : 'Événement refusé. Notification envoyée au président.'
      );
      setRejectModalOpen(false);
      setTargetEventId(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'events', 'moderation'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la modération');
    }
  });

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setSelectedOrganizers(['ADEI']);
    setEventForm({
      title: '',
      category: 'Conférence',
      date: '',
      time: '14:00',
      location: 'Amphi A — ENSA Fès',
      organizer: 'ADEI',
      clubId: '',
      link: '',
      description: ''
    });
    setEventImage(null);
    setFieldErrors({});
    setEventModalOpen(true);
  };

  const handleOpenEdit = (ev: EventItem) => {
    setEditingEvent(ev);
    const orgs = ev.organizer ? ev.organizer.split(/[•,]/).map((s) => s.trim()).filter(Boolean) : ['ADEI'];
    setSelectedOrganizers(orgs.length > 0 ? orgs : ['ADEI']);
    setEventForm({
      title: ev.title,
      category: ev.category || 'Conférence',
      date: ev.date,
      time: ev.time,
      location: ev.location,
      organizer: ev.organizer || 'ADEI',
      clubId: ev.clubId ? String(ev.clubId) : '',
      link: ev.link || '',
      description: ev.description
    });
    setEventImage(null);
    setFieldErrors({});
    setEventModalOpen(true);
  };

  const handleExportCSV = (ev: EventItem) => {
    if (!ev.registrations || ev.registrations.length === 0) {
      toast.error('Aucun inscrit à exporter.');
      return;
    }
    const headers = ['Nom & Prénom', 'Email', 'Téléphone', 'Filière / Niveau', 'Type', 'Date d\'inscription'];
    const rows = ev.registrations.map((reg) => [
      reg.user?.username || reg.guestName || (reg.userId ? `Utilisateur #${reg.userId}` : 'Invité'),
      reg.user?.email || reg.guestEmail || '',
      reg.user?.phone || reg.guestPhone || '',
      reg.user?.filiere ? `${reg.user.filiere} ${reg.user.classe ? `(${reg.user.classe})` : ''}` : (reg.guestFiliere || ''),
      reg.userId ? 'Compte ENSA vérifié' : 'Invité manuel',
      new Date(reg.createdAt).toLocaleString('fr-FR')
    ]);

    exportToCsv(`inscrits-${ev.title.replace(/[^a-zA-Z0-9]/g, '_')}`, headers, rows);
    void apiRequest('/audit/log-export', {
      method: 'POST',
      body: JSON.stringify({
        eventId: ev.id,
        eventTitle: ev.title,
        count: ev.registrations.length
      })
    }).catch(() => {});
    toast.success('Liste exportée en CSV avec succès !');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Veuillez corriger les champs requis signalés en rouge.');
      return;
    }
    setFieldErrors({});
    saveMutation.mutate();
  };

  const handleApprove = (id: number) => {
    statusMutation.mutate({ id, status: 'approved' });
  };

  const handleOpenReject = (id: number) => {
    setTargetEventId(id);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = (e: FormEvent) => {
    e.preventDefault();
    if (!targetEventId) return;
    statusMutation.mutate({ id: targetEventId, status: 'rejected', reason: rejectionReason });
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton Création Directe */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Événements &amp; Modération ADEI
          </h1>
          <p className="text-xs text-zinc-500">
            Publiez les événements officiels de l'ADEI, suivez les inscriptions étudiantes et validez les propositions soumises par les clubs.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Nouvel événement officiel
        </Button>
      </div>

      {/* Barre de contrôle : Onglets & Recherche */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList className="h-10 rounded-xl p-1">
            <TabsTrigger value="all" className="rounded-lg px-3 text-xs font-semibold">
              Tous ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1.5 rounded-lg px-3 text-xs font-semibold">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              En attente ({counts.pending})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-1.5 rounded-lg px-3 text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              En ligne ({counts.approved})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-1.5 rounded-lg px-3 text-xs font-semibold">
              <XCircle className="h-3.5 w-3.5 text-rose-500" />
              Refusés ({counts.rejected})
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

      {/* Grille des événements */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-red-600" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
          <CalendarDays className="mx-auto h-9 w-9 text-zinc-400" />
          <h3 className="mt-3 text-sm font-bold">Aucun événement trouvé</h3>
          <p className="mt-1 text-xs text-zinc-500">Aucun événement ne correspond à ce filtre ou critère de recherche.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((ev) => {
            const attendeesCount = ev.registrations?.length || ev.registrationsCount || 0;

            return (
              <div
                key={ev.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <div className="relative h-44 bg-zinc-900">
                    <img
                      src={ev.image ? getImageUrl(ev.image) : '/images/default.jpg'}
                      alt={ev.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute right-3 top-3 flex items-center gap-1.5">
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

                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500">
                      <span>{ev.date} à {ev.time}</span>
                      <span className="font-bold text-red-600">{ev.organizer || 'ADEI'}</span>
                    </div>

                    <h3 className="font-extrabold text-base leading-snug text-zinc-900 dark:text-zinc-100">
                      {ev.title}
                    </h3>

                    <p className="flex items-center gap-1 text-xs text-zinc-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-red-600" /> {ev.location}
                    </p>

                    <p className="line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {ev.description}
                    </p>

                    {/* Badge Inscrits avec ouverture modale */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveEventAttendees(ev);
                          setAttendeesModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-50/60 px-2.5 py-1 text-[11px] font-bold text-red-700 transition hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-900/40"
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>{attendeesCount} étudiant(s) inscrit(s)</span>
                      </button>
                    </div>

                    {ev.submitter && (
                      <div className="rounded-xl bg-zinc-50 p-2 text-[11px] text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
                        <p className="font-semibold">Soumis par : {ev.submitter.username}</p>
                        <p className="text-zinc-400">{ev.submitter.email}</p>
                      </div>
                    )}

                    {ev.status === 'rejected' && ev.rejectionReason && (
                      <p className="text-xs font-medium text-rose-600">
                        Motif du refus : {ev.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Barre d'actions */}
                <div className="space-y-2 border-t border-zinc-100 p-3 dark:border-zinc-800">
                  {/* Actions de modération (si pending ou rejected) */}
                  {ev.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleApprove(ev.id)}
                        disabled={statusMutation.isPending}
                        className="h-8 flex-1 gap-1 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approuver
                      </Button>
                      <Button
                        onClick={() => handleOpenReject(ev.id)}
                        disabled={statusMutation.isPending}
                        variant="outline"
                        className="h-8 flex-1 gap-1 rounded-xl border-rose-300 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/30"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Refuser
                      </Button>
                    </div>
                  )}

                  {/* Boutons d'édition et suppression administrateur */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(ev)}
                      className="h-8 flex-1 gap-1.5 rounded-xl border-zinc-200 text-xs font-semibold hover:border-zinc-400 dark:border-zinc-700"
                    >
                      <Pencil className="h-3 w-3" /> Modifier
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeletingEventId(ev.id);
                        setDeleteModalOpen(true);
                      }}
                      className="h-8 px-2.5 rounded-xl text-rose-600 border-zinc-200 hover:bg-rose-50 hover:border-rose-300 dark:border-zinc-700 dark:hover:bg-rose-950/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALE CRÉATION & ÉDITION */}
      <Modal
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        title={editingEvent ? `Modifier l'événement : ${editingEvent.title}` : 'Créer un nouvel événement officiel ADEI'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
          <div className="space-y-1">
            <Label htmlFor="ev-title" className="text-xs font-bold">Titre de l'événement *</Label>
            <Input
              id="ev-title"
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              placeholder="Ex: Forum ENSA Entreprises 2026"
              className={fieldErrors.title ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {fieldErrors.title && (
              <p className="text-[11px] text-red-500 flex items-center gap-1 mt-0.5">
                <AlertCircle className="h-3 w-3" /> {fieldErrors.title}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="ev-category" className="text-xs font-bold">Catégorie</Label>
            <select
              id="ev-category"
              value={eventForm.category}
              onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
              className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs dark:border-zinc-800 dark:bg-zinc-900"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Organisateurs / Co-organisateurs</Label>
            <OrganizersMultiSelect
              selected={selectedOrganizers}
              onChange={setSelectedOrganizers}
              availableClubs={clubs}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="ev-date" className="text-xs font-bold">Date de l'événement *</Label>
              <Input
                id="ev-date"
                type="date"
                value={eventForm.date}
                onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                className={fieldErrors.date ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {fieldErrors.date && (
                <p className="text-[11px] text-red-500 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="h-3 w-3" /> {fieldErrors.date}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="ev-time" className="text-xs font-bold">Heure (HH:MM) *</Label>
              <Input
                id="ev-time"
                value={eventForm.time}
                onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                placeholder="14:00"
                className={fieldErrors.time ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {fieldErrors.time && (
                <p className="text-[11px] text-red-500 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="h-3 w-3" /> {fieldErrors.time}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="ev-location" className="text-xs font-bold">Lieu *</Label>
            <Input
              id="ev-location"
              value={eventForm.location}
              onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
              placeholder="Ex: Amphi A — ENSA Fès"
              className={fieldErrors.location ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {fieldErrors.location && (
              <p className="text-[11px] text-red-500 flex items-center gap-1 mt-0.5">
                <AlertCircle className="h-3 w-3" /> {fieldErrors.location}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="ev-link" className="text-xs font-bold">Lien externe / billetterie (optionnel)</Label>
            <Input
              id="ev-link"
              value={eventForm.link}
              onChange={(e) => setEventForm({ ...eventForm, link: e.target.value })}
              placeholder="https://forms.gle/... ou https://..."
              className={fieldErrors.link ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {fieldErrors.link && (
              <p className="text-[11px] text-red-500 flex items-center gap-1 mt-0.5">
                <AlertCircle className="h-3 w-3" /> {fieldErrors.link}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="ev-image" className="text-xs font-bold">Affiche / Image de couverture</Label>
            <Input
              id="ev-image"
              type="file"
              accept="image/*"
              onChange={(e) => setEventImage(e.target.files?.[0] || null)}
              className="text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-red-50 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-red-700 hover:file:bg-red-100"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="ev-desc" className="text-xs font-bold">Description complète *</Label>
            <Textarea
              id="ev-desc"
              rows={4}
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              placeholder="Présentation détaillée, programme, modalités de participation..."
              className={fieldErrors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {fieldErrors.description && (
              <p className="text-[11px] text-red-500 flex items-center gap-1 mt-0.5">
                <AlertCircle className="h-3 w-3" /> {fieldErrors.description}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEventModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="gap-2 bg-red-600 text-white hover:bg-red-700"
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingEvent ? 'Enregistrer les modifications' : 'Publier l\'événement'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODALE LISTE DES INSCRITS */}
      <Modal
        open={attendeesModalOpen}
        onClose={() => setAttendeesModalOpen(false)}
        title={activeEventAttendees ? `Inscrits : ${activeEventAttendees.title}` : 'Liste des inscrits'}
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
          {activeEventAttendees?.registrations && activeEventAttendees.registrations.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="font-bold text-zinc-700 dark:text-zinc-300">
                  {activeEventAttendees.registrations.length} participant(s) inscrit(s)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportCSV(activeEventAttendees)}
                  className="h-8 gap-1.5 rounded-xl text-xs"
                >
                  <Download className="h-3.5 w-3.5" /> Exporter CSV
                </Button>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {activeEventAttendees.registrations.map((reg) => (
                  <div key={reg.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">
                          {reg.user?.username || reg.guestName || (reg.userId ? `Utilisateur #${reg.userId}` : 'Invité')}
                        </p>
                        {reg.userId ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] px-1.5 py-0">
                            Compte vérifié
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[10px] px-1.5 py-0">
                            Invité manuel
                          </Badge>
                        )}
                      </div>
                      <p className="text-zinc-500 flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3 text-zinc-400" />
                        <span>{reg.user?.email || reg.guestEmail || 'Email non renseigné'}</span>
                      </p>
                      {(reg.user?.phone || reg.guestPhone) && (
                        <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 text-zinc-400" />
                          <span>{reg.user?.phone || reg.guestPhone}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      {(reg.user?.filiere || reg.guestFiliere) && (
                        <Badge variant="secondary" className="text-[10px]">
                          {reg.user?.filiere || reg.guestFiliere} {reg.user?.classe ? `— ${reg.user.classe}` : ''}
                        </Badge>
                      )}
                      <p className="text-[10px] text-zinc-400">
                        {new Date(reg.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500">
              <Users className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
              <p className="font-bold">Aucune inscription enregistrée pour le moment.</p>
              <p className="mt-1">Les étudiants peuvent s'inscrire en 1 clic ou manuellement sur la page publique.</p>
            </div>
          )}
        </div>
      </Modal>

      {/* MODALE DE MOTIF DE REFUS */}
      <Modal open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Refuser la proposition d'événement">
        <form onSubmit={handleConfirmReject} className="space-y-4 pt-2">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Veuillez indiquer le motif du refus. Cette explication sera transmise par email officiel au président du club pour lui permettre de corriger sa demande.
          </p>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Motif du refus (optionnel mais recommandé)</Label>
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

      {/* MODALE CONFIRMATION DE SUPPRESSION */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Supprimer cet événement"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Êtes-vous certain de vouloir supprimer définitivement cet événement ? Cette action est irréversible et supprimera également les inscriptions associées.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="outline"
              disabled={deleteMutation.isPending}
              onClick={() => deletingEventId && deleteMutation.mutate(deletingEventId)}
              className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Supprimer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
