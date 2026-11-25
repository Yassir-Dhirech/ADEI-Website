import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  CalendarPlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  Save,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest, getImageUrl } from '@/lib/api';
import type { ClubItem, EventItem } from '@/types/api';
import { PageHero, Modal } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ClubPresidentPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'info' | 'events'>('info');

  // Modal Événement
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '14:00',
    location: 'Amphi A — ENSA Fès',
    category: 'Conférence',
    link: '',
    description: ''
  });
  const [eventImage, setEventImage] = useState<File | null>(null);

  // 1. Récupération du Club du président
  const { data: clubRes, isLoading: clubLoading } = useQuery({
    queryKey: ['clubs', 'my-club'],
    queryFn: () => apiRequest<ClubItem>('/clubs/my-club')
  });
  const club = clubRes?.data;

  // 2. Récupération des événements soumis par le président
  const { data: eventsRes } = useQuery({
    queryKey: ['events', 'my-events'],
    queryFn: () => apiRequest<EventItem[]>('/events/my-events')
  });
  const myEvents = eventsRes?.data || [];

  // 3. Formulaire de modification du Club
  const [clubForm, setClubForm] = useState({
    tel: '',
    email: '',
    website: '',
    instagram: '',
    linkedin: '',
    description: '',
    activities: ''
  });
  const [clubLogo, setClubLogo] = useState<File | null>(null);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  if (club && !isFormInitialized) {
    setClubForm({
      tel: club.tel || '',
      email: club.email || '',
      website: club.website || '',
      instagram: club.instagram || '',
      linkedin: club.linkedin || '',
      description: club.description || '',
      activities: (club.activities || []).join('\n')
    });
    setIsFormInitialized(true);
  }

  // Mutation : Proposition de mise à jour du club
  const clubUpdateMutation = useMutation({
    mutationFn: async () => {
      if (!club) return;
      const formData = new FormData();
      formData.append('tel', clubForm.tel);
      formData.append('email', clubForm.email);
      formData.append('website', clubForm.website);
      formData.append('instagram', clubForm.instagram);
      formData.append('linkedin', clubForm.linkedin);
      formData.append('description', clubForm.description);
      const acts = clubForm.activities
        .split('\n')
        .map((a) => a.trim())
        .filter(Boolean);
      formData.append('activities', JSON.stringify(acts));
      if (clubLogo) formData.append('image', clubLogo);

      return apiRequest(`/clubs/${club.id}/propose-update`, {
        method: 'PUT',
        body: formData
      });
    },
    onSuccess: () => {
      toast.success("Modifications transmises au bureau de l'ADEI pour validation.");
      queryClient.invalidateQueries({ queryKey: ['clubs', 'my-club'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la soumission');
    }
  });

  // Mutation : Soumission d'un nouvel événement
  const eventSubmitMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('title', eventForm.title);
      formData.append('date', eventForm.date);
      formData.append('time', eventForm.time);
      formData.append('location', eventForm.location);
      formData.append('category', eventForm.category);
      formData.append('link', eventForm.link);
      formData.append('description', eventForm.description);
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
          ? "Événement modifié et renvoyé à l'ADEI pour re-validation."
          : "Événement proposé avec succès ! En attente de validation ADEI."
      );
      setEventModalOpen(false);
      setEditingEvent(null);
      setEventImage(null);
      setEventForm({
        title: '',
        date: '',
        time: '14:00',
        location: 'Amphi A — ENSA Fès',
        category: 'Conférence',
        link: '',
        description: ''
      });
      queryClient.invalidateQueries({ queryKey: ['events', 'my-events'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la soumission');
    }
  });

  const openNewEventModal = () => {
    setEditingEvent(null);
    setEventForm({
      title: '',
      date: '',
      time: '14:00',
      location: 'Amphi A — ENSA Fès',
      category: 'Conférence',
      link: '',
      description: ''
    });
    setEventImage(null);
    setEventModalOpen(true);
  };

  const openEditEventModal = (ev: EventItem) => {
    setEditingEvent(ev);
    setEventForm({
      title: ev.title,
      date: ev.date,
      time: ev.time,
      location: ev.location,
      category: ev.category || 'Atelier',
      link: ev.link || '',
      description: ev.description
    });
    setEventImage(null);
    setEventModalOpen(true);
  };

  if (clubLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold">Aucun club rattaché à votre compte</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Votre compte n'est pas encore associé à un club officiel de l'ENSA Fès. Veuillez contacter le bureau de l'ADEI pour finaliser votre affectation.
        </p>
      </div>
    );
  }

  const pendingEventsCount = myEvents.filter((e) => e.status === 'pending').length;
  const approvedEventsCount = myEvents.filter((e) => e.status === 'approved').length;

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <PageHero
        badge="Espace Présidents de Club"
        title={`Espace Club : ${club.club}`}
        subtitle="Gérez la présentation de votre club et soumettez vos événements à la validation du bureau de l'ADEI."
        image={club.image ? getImageUrl(club.image) : '/images/default.jpg'}
      />

      {/* Onglets principaux */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'info' | 'events')}>
          <TabsList className="h-11 rounded-xl p-1">
            <TabsTrigger value="info" className="gap-2 rounded-lg px-4 text-xs font-semibold">
              <FileEdit className="h-3.5 w-3.5" /> Fiche du Club
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2 rounded-lg px-4 text-xs font-semibold">
              <CalendarDays className="h-3.5 w-3.5" /> Nos Événements ({myEvents.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === 'events' && (
          <Button onClick={openNewEventModal} className="h-10 gap-2 rounded-xl bg-red-600 text-xs font-semibold text-white">
            <CalendarPlus className="h-4 w-4" /> Proposer un événement
          </Button>
        )}
      </div>

      {/* CONTENU ONGLET 1 : FICHE DU CLUB */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          {/* Alerte si des modifications sont déjà en attente */}
          {club.pendingUpdates && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-500/10 p-4 text-amber-900 dark:border-amber-900/50 dark:text-amber-200">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold">Modifications en cours d'examen par le bureau ADEI</p>
                <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">
                  Vous avez soumis des modifications pour votre club. Elles seront publiées publiquement dès leur validation par l'administration de l'ADEI.
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Formulaire d'édition */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                clubUpdateMutation.mutate();
              }}
              className="space-y-5 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-8"
            >
              <h3 className="text-lg font-bold">Mettre à jour les informations du club</h3>
              <p className="text-xs text-zinc-500">
                Toutes les modifications soumises nécessitent l'approbation du bureau de l'ADEI avant affichage en ligne.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Téléphone de contact</Label>
                  <Input
                    value={clubForm.tel}
                    onChange={(e) => setClubForm({ ...clubForm, tel: e.target.value })}
                    placeholder="+212 6..."
                    className="h-10 rounded-xl text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Email officiel</Label>
                  <Input
                    type="email"
                    value={clubForm.email}
                    onChange={(e) => setClubForm({ ...clubForm, email: e.target.value })}
                    placeholder="club@adei-ensaf.ma"
                    className="h-10 rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Site Web (optionnel)</Label>
                  <Input
                    value={clubForm.website}
                    onChange={(e) => setClubForm({ ...clubForm, website: e.target.value })}
                    placeholder="https://..."
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Instagram (URL)</Label>
                  <Input
                    value={clubForm.instagram}
                    onChange={(e) => setClubForm({ ...clubForm, instagram: e.target.value })}
                    placeholder="https://instagram.com/..."
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">LinkedIn (URL)</Label>
                  <Input
                    value={clubForm.linkedin}
                    onChange={(e) => setClubForm({ ...clubForm, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/company/..."
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Logo ou Image officielle</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setClubLogo(e.target.files?.[0] || null)}
                  className="rounded-xl text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-2.5 file:py-1 file:text-xs dark:file:bg-zinc-800"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Présentation & Description du club</Label>
                <Textarea
                  rows={4}
                  value={clubForm.description}
                  onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
                  placeholder="Décrivez les objectifs et la vocation de votre club..."
                  className="rounded-xl text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Activités phares (une par ligne)</Label>
                <Textarea
                  rows={3}
                  value={clubForm.activities}
                  onChange={(e) => setClubForm({ ...clubForm, activities: e.target.value })}
                  placeholder="Atelier Deep Learning&#10;Hackathon 48h&#10;Bootcamp React"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={clubUpdateMutation.isPending}
                  className="h-11 w-full gap-2 rounded-xl bg-red-600 text-xs font-semibold text-white hover:bg-red-700"
                >
                  {clubUpdateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Soumettre les modifications à l'ADEI
                </Button>
              </div>
            </form>

            {/* Aperçu Fiche Club */}
            <div className="space-y-4 lg:col-span-4">
              <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Aperçu en ligne</h4>
                <div className="mt-4 flex flex-col items-center text-center">
                  <img
                    src={club.image ? getImageUrl(club.image) : '/images/default.jpg'}
                    alt={club.club}
                    className="h-20 w-20 rounded-2xl object-cover shadow-md"
                  />
                  <h3 className="mt-3 font-extrabold">{club.club}</h3>
                  <p className="text-xs text-red-600">{club.president}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">{club.annees_etude}</p>
                </div>
                <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                  <p className="truncate">Email : {club.email}</p>
                  <p className="truncate">Tél : {club.tel}</p>
                  <p>Membres : {club.members} étudiants</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENU ONGLET 2 : NOS ÉVÉNEMENTS */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          {/* Synthèse des statuts */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400">
              <p className="text-xs font-semibold">En attente de validation</p>
              <p className="mt-1 text-2xl font-black">{pendingEventsCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-400">
              <p className="text-xs font-semibold">Publiés &amp; En ligne</p>
              <p className="mt-1 text-2xl font-black">{approvedEventsCount}</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm sm:col-span-1 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-semibold text-zinc-500">Total événements</p>
              <p className="mt-1 text-2xl font-black">{myEvents.length}</p>
            </div>
          </div>

          {/* Liste des événements */}
          {myEvents.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
              <CalendarDays className="mx-auto h-10 w-10 text-zinc-400" />
              <h3 className="mt-3 text-base font-bold">Aucun événement soumis</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Vous n'avez pas encore proposé d'événement pour votre club.
              </p>
              <Button onClick={openNewEventModal} className="mt-4 gap-2 rounded-xl bg-red-600 text-xs font-semibold text-white">
                <CalendarPlus className="h-4 w-4" /> Proposer un premier événement
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {myEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-4">
                    {ev.image ? (
                      <img src={getImageUrl(ev.image)} alt={ev.title} className="h-16 w-16 rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-red-600/10 text-red-600">
                        <CalendarDays className="h-7 w-7" />
                      </div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold">{ev.title}</h4>
                        {ev.status === 'pending' && (
                          <Badge className="gap-1 border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Clock className="h-3 w-3" /> En attente ADEI
                          </Badge>
                        )}
                        {ev.status === 'approved' && (
                          <Badge className="gap-1 border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Publié en ligne
                          </Badge>
                        )}
                        {ev.status === 'rejected' && (
                          <Badge className="gap-1 border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            <AlertCircle className="h-3 w-3" /> Refusé
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                        <span>Date : {ev.date} à {ev.time}</span>
                        <span>· {ev.location}</span>
                      </p>
                      {ev.status === 'rejected' && ev.rejectionReason && (
                        <p className="mt-2 text-xs font-medium text-rose-600">
                          Motif du bureau ADEI : {ev.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => openEditEventModal(ev)}
                      variant="outline"
                      className="h-9 gap-1.5 rounded-xl text-xs font-semibold"
                    >
                      <FileEdit className="h-3.5 w-3.5" /> Modifier
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL : NOUVEL ÉVÉNEMENT / ÉDITION */}
      <Modal
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        title={editingEvent ? "Modifier la proposition d'événement" : "Proposer un nouvel événement"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            eventSubmitMutation.mutate();
          }}
          className="space-y-4 pt-2"
        >
          {editingEvent && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
              <strong>Attention :</strong> Toute modification d'un événement repassera par le statut <strong>En attente</strong> et devra être re-validée par le bureau de l'ADEI avant réaffichage public.
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Titre de l'événement</Label>
            <Input
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              placeholder="Ex: Conférence Cybersécurité & IA"
              className="h-10 rounded-xl text-xs"
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Date</Label>
              <Input
                type="date"
                value={eventForm.date}
                onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                className="h-10 rounded-xl text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Heure de début (HH:MM)</Label>
              <Input
                value={eventForm.time}
                onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                placeholder="14:30"
                className="h-10 rounded-xl text-xs"
                required
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Lieu</Label>
              <Input
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                placeholder="Amphi A / Salle Informatique 3"
                className="h-10 rounded-xl text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Catégorie</Label>
              <Input
                value={eventForm.category}
                onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                placeholder="Conférence / Atelier / Tournoi"
                className="h-10 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Lien d'inscription ou d'information (optionnel)</Label>
            <Input
              value={eventForm.link}
              onChange={(e) => setEventForm({ ...eventForm, link: e.target.value })}
              placeholder="https://..."
              className="h-10 rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Affiche de l'événement (JPG, PNG)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setEventImage(e.target.files?.[0] || null)}
              className="rounded-xl text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-2.5 file:py-1 file:text-xs dark:file:bg-zinc-800"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Description détaillée &amp; Programme</Label>
            <Textarea
              rows={4}
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              placeholder="Objectifs, intervenants, prérequis pour les étudiants..."
              className="rounded-xl text-xs"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEventModalOpen(false)}
              className="h-10 rounded-xl text-xs"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={eventSubmitMutation.isPending}
              className="h-10 gap-2 rounded-xl bg-red-600 text-xs font-semibold text-white hover:bg-red-700"
            >
              {eventSubmitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingEvent ? "Soumettre pour validation" : "Proposer l'événement"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}