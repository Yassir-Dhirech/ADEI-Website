import { useState, useMemo, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Building2,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest, getImageUrl } from '@/lib/api';
import type { ClubItem, User } from '@/types/api';
import { Modal } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const MANDAT_OPTIONS = ['2025/2026', '2026/2027', '2027/2028', '2028/2029'];
const DEFAULT_MANDAT = '2026/2027';

export function ClubsAdminPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'clubs' | 'pending'>('clubs');
  const [search, setSearch] = useState('');

  // Modale Création / Édition
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<ClubItem | null>(null);

  // Form State
  const [form, setForm] = useState({
    club: '',
    presidentId: 'none',
    president: 'Non assigné pour le moment',
    annees_etude: DEFAULT_MANDAT,
    tel: '',
    email: '',
    members: '0',
    website: '',
    instagram: '',
    linkedin: '',
    facebook: '',
    description: '',
    activities: '',
    achievements: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Gestion des erreurs par champ (Exception Management)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Modale Suppression
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Modale Rejet de mise à jour
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetClubId, setTargetClubId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // 1. Récupération des clubs
  const { data: clubsRes, isLoading: clubsLoading } = useQuery({
    queryKey: ['admin', 'clubs'],
    queryFn: () => apiRequest<ClubItem[]>('/clubs')
  });
  const clubs = clubsRes?.data || [];

  // 2. Récupération des utilisateurs pour le dropdown d'assignation
  const { data: usersRes } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => apiRequest<User[]>('/users')
  });
  const users = usersRes?.data || [];

  // Filtrage des modifications en attente
  const pendingClubs = useMemo(() => {
    return clubs.filter((c) => Boolean(c.pendingUpdates));
  }, [clubs]);

  // Filtrage par recherche
  const filteredClubs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clubs;
    return clubs.filter(
      (c) =>
        c.club.toLowerCase().includes(q) ||
        (c.president && c.president.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [clubs, search]);

  const invalidateClubs = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'clubs'] });
    void queryClient.invalidateQueries({ queryKey: ['clubs'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'counts'] });
  };

  // Validation stricte côté client
  const validateForm = () => {
    const errs: Record<string, string> = {};

    const trimmedClub = form.club.trim();
    if (!trimmedClub) {
      errs.club = 'Le nom du club est obligatoire.';
    } else if (trimmedClub.length < 2) {
      errs.club = 'Le nom du club doit comporter au moins 2 caractères.';
    } else if (trimmedClub.length > 100) {
      errs.club = 'Le nom du club ne peut pas dépasser 100 caractères.';
    }

    if (form.email && form.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        errs.email = "L'adresse email n'a pas un format valide (ex: contact@adei-ensaf.ma).";
      }
    }

    if (form.tel && form.tel.trim() !== '' && form.tel.trim() !== '—') {
      const phoneClean = form.tel.trim().replace(/[\s\-\.]/g, '');
      const phoneRegex = /^(\+212|0)([5-7]\d{8})$|^(\+\d{1,4}\d{6,14})$/;
      if (!phoneRegex.test(phoneClean)) {
        errs.tel = 'Format de téléphone invalide (ex: +212612345678 ou 0612345678).';
      }
    }

    const urlRegex = /^https?:\/\/.+/i;
    if (form.website && form.website.trim() !== '' && !urlRegex.test(form.website.trim())) {
      errs.website = "L'URL doit débuter par https:// ou http://";
    }
    if (form.instagram && form.instagram.trim() !== '' && !urlRegex.test(form.instagram.trim())) {
      errs.instagram = "L'URL Instagram doit débuter par https://";
    }
    if (form.linkedin && form.linkedin.trim() !== '' && !urlRegex.test(form.linkedin.trim())) {
      errs.linkedin = "L'URL LinkedIn doit débuter par https://";
    }
    if (form.facebook && form.facebook.trim() !== '' && !urlRegex.test(form.facebook.trim())) {
      errs.facebook = "L'URL Facebook doit débuter par https://";
    }

    const membersNum = parseInt(form.members, 10);
    if (Number.isNaN(membersNum) || membersNum < 0) {
      errs.members = 'Le nombre de membres doit être un nombre positif ou nul.';
    }

    if (logoFile) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(logoFile.type)) {
        errs.logo = 'Format non supporté (seuls JPG, PNG, WebP sont acceptés).';
      } else if (logoFile.size > 5 * 1024 * 1024) {
        errs.logo = 'Le fichier est trop volumineux (maximum 5 Mo).';
      }
    }

    return errs;
  };

  // Mutation Sauvegarde (Création / Mise à jour)
  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('club', form.club.trim());
      fd.append('presidentId', form.presidentId);
      fd.append('president', form.president || 'Non assigné pour le moment');
      fd.append('annees_etude', form.annees_etude || DEFAULT_MANDAT);
      if (form.tel.trim()) fd.append('tel', form.tel.trim());
      if (form.email.trim()) fd.append('email', form.email.trim());
      if (form.members) fd.append('members', form.members);
      if (form.website.trim()) fd.append('website', form.website.trim());
      if (form.instagram.trim()) fd.append('instagram', form.instagram.trim());
      if (form.linkedin.trim()) fd.append('linkedin', form.linkedin.trim());
      if (form.facebook.trim()) fd.append('facebook', form.facebook.trim());
      if (form.description.trim()) fd.append('description', form.description.trim());

      if (form.activities) {
        const arr = form.activities.split(',').map((s) => s.trim()).filter(Boolean);
        fd.append('activities', JSON.stringify(arr));
      }
      if (form.achievements) {
        const arr = form.achievements.split(',').map((s) => s.trim()).filter(Boolean);
        fd.append('achievements', JSON.stringify(arr));
      }

      if (logoFile) {
        fd.append('image', logoFile);
      }

      if (editingClub) {
        return apiRequest(`/clubs/${editingClub.id}`, {
          method: 'PUT',
          body: fd
        });
      } else {
        return apiRequest('/clubs', {
          method: 'POST',
          body: fd
        });
      }
    },
    onSuccess: () => {
      toast.success(editingClub ? 'Club mis à jour avec succès !' : 'Nouveau club créé avec succès !');
      setModalOpen(false);
      setEditingClub(null);
      setLogoFile(null);
      setFieldErrors({});
      invalidateClubs();
    },
    onError: (err: unknown) => {
      const anyErr = err as { details?: Array<{ field?: string; message: string }>; message?: string };
      if (anyErr?.details && Array.isArray(anyErr.details)) {
        const mapped: Record<string, string> = {};
        anyErr.details.forEach((d) => {
          if (d.field) mapped[d.field] = d.message;
        });
        setFieldErrors(mapped);
        toast.error('Certains champs sont invalides selon les règles de validation du serveur.');
      } else {
        toast.error(anyErr?.message || "Erreur lors de l'enregistrement du club");
      }
    }
  });

  // Mutation Suppression
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/clubs/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast.success('Club supprimé avec succès !');
      setDeleteModalOpen(false);
      setDeletingId(null);
      invalidateClubs();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  });

  // Mutation Approbation mise à jour président
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/clubs/${id}/approve-update`, { method: 'POST' });
    },
    onSuccess: () => {
      toast.success('Modifications validées et appliquées à la fiche officielle !');
      invalidateClubs();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la validation');
    }
  });

  // Mutation Rejet mise à jour président
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return apiRequest(`/clubs/${id}/reject-update`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
    },
    onSuccess: () => {
      toast.success('Modifications rejetées. Le président a été notifié par email.');
      setRejectModalOpen(false);
      setTargetClubId(null);
      setRejectionReason('');
      invalidateClubs();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du rejet');
    }
  });

  // Ouverture modale création
  const handleOpenCreate = () => {
    setEditingClub(null);
    setForm({
      club: '',
      presidentId: 'none',
      president: 'Non assigné pour le moment',
      annees_etude: DEFAULT_MANDAT,
      tel: '',
      email: 'contact@adei-ensaf.ma',
      members: '0',
      website: '',
      instagram: '',
      linkedin: '',
      facebook: '',
      description: '',
      activities: '',
      achievements: ''
    });
    setLogoFile(null);
    setFieldErrors({});
    setModalOpen(true);
  };

  // Ouverture modale édition
  const handleOpenEdit = (c: ClubItem) => {
    setEditingClub(c);
    setForm({
      club: c.club,
      presidentId: c.presidentId ? String(c.presidentId) : 'none',
      president: c.president || 'Non assigné pour le moment',
      annees_etude: c.annees_etude || DEFAULT_MANDAT,
      tel: c.tel && c.tel !== '—' ? c.tel : '',
      email: c.email || 'contact@adei-ensaf.ma',
      members: String(c.members || 0),
      website: c.website || '',
      instagram: c.instagram || '',
      linkedin: c.linkedin || '',
      facebook: c.facebook || '',
      description: c.description || '',
      activities: Array.isArray(c.activities) ? c.activities.join(', ') : '',
      achievements: Array.isArray(c.achievements) ? c.achievements.join(', ') : ''
    });
    setLogoFile(null);
    setFieldErrors({});
    setModalOpen(true);
  };

  // Changement d'assignation du président : pré-remplissage automatique des coordonnées
  const handlePresidentSelectChange = (userId: string) => {
    if (userId === 'none') {
      setForm((prev) => ({
        ...prev,
        presidentId: 'none',
        president: 'Non assigné pour le moment',
        email: 'contact@adei-ensaf.ma',
        tel: ''
      }));
    } else {
      const selectedUser = users.find((u) => String(u.id) === userId);
      if (selectedUser) {
        setForm((prev) => ({
          ...prev,
          presidentId: userId,
          president: selectedUser.username,
          email: selectedUser.email,
          tel: selectedUser.phone || ''
        }));
      }
    }
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.president;
      delete next.presidentId;
      delete next.email;
      delete next.tel;
      return next;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      toast.error('Veuillez corriger les champs signalés en rouge.');
      return;
    }
    setFieldErrors({});
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header Institutionnel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Gestion & Modération des Clubs
          </h1>
          <p className="text-sm text-zinc-500">
            Création centralisée des clubs, assignation des présidents et validation des fiches officielles.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Nouveau Club
        </Button>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'clubs' | 'pending')}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="bg-zinc-100 dark:bg-zinc-800">
            <TabsTrigger value="clubs" className="gap-2">
              <Building2 className="h-4 w-4" /> Tous les clubs ({clubs.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Mises à jour en attente
              {pendingClubs.length > 0 && (
                <span className="ml-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                  {pendingClubs.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {activeTab === 'clubs' && (
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Rechercher un club ou président..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
        </div>

        {/* TAB 1 : TOUS LES CLUBS */}
        {activeTab === 'clubs' && (
          <div className="mt-6 space-y-4">
            {clubsLoading ? (
              <div className="flex items-center justify-center py-20 text-zinc-400">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Chargement des clubs...
              </div>
            ) : filteredClubs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 py-16 text-center text-sm text-zinc-500 dark:border-zinc-800">
                Aucun club trouvé pour les critères sélectionnés.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredClubs.map((club) => {
                  const isAssigned = club.president && club.president !== 'Non assigné pour le moment';
                  const hasPending = Boolean(club.pendingUpdates);

                  return (
                    <div
                      key={club.id}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-red-500/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div>
                        {/* En-tête de la carte */}
                        <div className="flex items-start gap-3.5">
                          <img
                            src={getImageUrl(club.image)}
                            alt={club.club}
                            className="h-14 w-14 rounded-xl border border-zinc-200 object-cover dark:border-zinc-700"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-base font-bold text-zinc-900 group-hover:text-red-600 dark:text-zinc-50">
                              {club.club}
                            </h3>

                            {/* Statut Président */}
                            <div className="mt-1">
                              {isAssigned ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" /> {club.president}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
                                  <Clock className="h-3 w-3" /> Non assigné pour le moment
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Badge de mise à jour en attente */}
                        {hasPending && (
                          <div className="mt-3 flex items-center justify-between rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                            <span className="flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5" />
                              Modifications en attente
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveTab('pending')}
                              className="font-bold underline hover:text-amber-900 dark:hover:text-amber-100"
                            >
                              Examiner →
                            </button>
                          </div>
                        )}

                        {/* Description */}
                        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                          {club.description || 'Aucune description rédigée.'}
                        </p>

                        {/* Coordonnées */}
                        <div className="mt-4 space-y-1 text-xs text-zinc-500">
                          <p className="truncate">Email : {club.email || 'contact@adei-ensaf.ma'}</p>
                          <p className="truncate">Téléphone : {club.tel || '—'}</p>
                          <p className="truncate">Mandat : {club.annees_etude || DEFAULT_MANDAT}</p>
                        </div>
                      </div>

                      {/* Barre d'actions */}
                      <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
                        <span className="flex items-center gap-1 text-xs font-medium text-zinc-400">
                          <Users className="h-3.5 w-3.5" /> {club.members || 0} membres
                        </span>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(club)}
                            className="h-8 gap-1 px-2.5 text-xs"
                          >
                            <Pencil className="h-3 w-3" /> Modifier
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletingId(club.id);
                              setDeleteModalOpen(true);
                            }}
                            className="h-8 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
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
          </div>
        )}

        {/* TAB 2 : MISES À JOUR EN ATTENTE (MODÉRATION COMPARATIVE) */}
        {activeTab === 'pending' && (
          <div className="mt-6 space-y-6">
            {pendingClubs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-16 text-center dark:border-zinc-800">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Toutes les fiches sont à jour
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Aucun président n'a soumis de modification en attente de validation.
                </p>
              </div>
            ) : (
              pendingClubs.map((club) => {
                const pending = (club.pendingUpdates || {}) as Record<string, unknown>;

                return (
                  <div
                    key={club.id}
                    className="overflow-hidden rounded-2xl border border-amber-300/80 bg-white shadow-sm dark:border-amber-700/50 dark:bg-zinc-900"
                  >
                    {/* Header comparateur */}
                    <div className="flex flex-col gap-3 bg-amber-500/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:bg-amber-500/5">
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(club.image)}
                          alt={club.club}
                          className="h-12 w-12 rounded-xl border border-amber-300 object-cover dark:border-amber-700"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{club.club}</h2>
                            <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
                              Proposition reçue
                            </Badge>
                          </div>
                          <p className="text-xs text-zinc-500">
                            Président : {club.president} • Soumis le{' '}
                            {club.pendingUpdatesAt ? new Date(club.pendingUpdatesAt).toLocaleDateString('fr-FR') : '—'}
                          </p>
                        </div>
                      </div>

                      {/* Boutons d'action rapides */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setTargetClubId(club.id);
                            setRejectionReason('');
                            setRejectModalOpen(true);
                          }}
                          className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/40 dark:hover:bg-red-950/20"
                        >
                          <XCircle className="h-4 w-4" /> Rejeter
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(club.id)}
                          disabled={approveMutation.isPending}
                          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                        >
                          {approveMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Valider & Publier
                        </Button>
                      </div>
                    </div>

                    {/* Comparateur Visuel Côte-à-Côte */}
                    <div className="grid divide-y divide-zinc-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 dark:divide-zinc-800">
                      {/* Colonne Gauche : Données Actuelles */}
                      <div className="space-y-4 p-6 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                          <span>Version Officielle Actuelle</span>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-zinc-500">Description</p>
                          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                            {club.description || 'Non renseignée.'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="font-semibold text-zinc-500">Email</p>
                            <p className="text-zinc-700 dark:text-zinc-300">{club.email || '—'}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-500">Téléphone</p>
                            <p className="text-zinc-700 dark:text-zinc-300">{club.tel || '—'}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-500">Membres</p>
                            <p className="text-zinc-700 dark:text-zinc-300">{club.members || 0}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-500">Site Web</p>
                            <p className="text-zinc-700 dark:text-zinc-300">{club.website || '—'}</p>
                          </div>
                        </div>

                        {club.activities && club.activities.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-zinc-500">Activités</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {club.activities.map((a, i) => (
                                <Badge key={i} variant="secondary" className="text-[11px]">
                                  {a}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Colonne Droite : Modifications Proposées */}
                      <div className="space-y-4 p-6 bg-emerald-50/20 dark:bg-emerald-950/10">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          <ArrowRight className="h-3.5 w-3.5" />
                          <span>Modifications Proposées</span>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-zinc-500">Nouvelle Description</p>
                          <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {String(pending.description || club.description || 'Non renseignée.')}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="font-semibold text-zinc-500">Nouvel Email</p>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {String(pending.email || club.email || '—')}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-500">Nouveau Téléphone</p>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {String(pending.tel || club.tel || '—')}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-500">Membres</p>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {String(pending.members ?? club.members ?? 0)}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-500">Site Web</p>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {String(pending.website || club.website || '—')}
                            </p>
                          </div>
                        </div>

                        {pending.activities !== undefined && (
                          <div>
                            <p className="text-xs font-semibold text-zinc-500">Nouvelles Activités</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {(Array.isArray(pending.activities) ? pending.activities : []).map((a, i) => (
                                <Badge key={i} variant="outline" className="border-emerald-500 text-emerald-600 text-[11px]">
                                  {String(a)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </Tabs>

      {/* MODALE CRÉATION & ÉDITION */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClub ? `Modifier la fiche : ${editingClub.club}` : 'Créer un nouveau club'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
          {/* Nom du Club */}
          <div className="space-y-1.5">
            <Label htmlFor="club">Nom officiel du club *</Label>
            <Input
              id="club"
              placeholder="ex: Club Robotique, Club Informatique..."
              value={form.club}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, club: e.target.value }));
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.club;
                  return next;
                });
              }}
              className={cn(fieldErrors.club && 'border-red-500 bg-red-50/20 focus-visible:ring-red-500')}
              required
            />
            {fieldErrors.club && (
              <p className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {fieldErrors.club}
              </p>
            )}
          </div>

          {/* Assignation du Président (Nom & Prénom uniquement dans la liste) */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <Label htmlFor="presidentSelect" className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="h-4 w-4 text-red-600" />
              Assigner le Président (Nom & Prénom de l'étudiant)
            </Label>
            <select
              id="presidentSelect"
              value={form.presidentId}
              onChange={(e) => handlePresidentSelectChange(e.target.value)}
              className={cn(
                'w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm shadow-sm transition focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-800',
                fieldErrors.presidentId && 'border-red-500 bg-red-50/20'
              )}
            >
              <option value="none">-- Non assigné pour le moment --</option>
              {users.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.username}
                </option>
              ))}
            </select>

            {form.presidentId !== 'none' && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  Président désigné : <strong>{form.president}</strong>. Ses coordonnées ont été renseignées
                  automatiquement ci-dessous.
                </span>
              </div>
            )}

            <p className="text-[11px] text-zinc-500 leading-normal">
              L'étudiant sélectionné par son Nom & Prénom disposera automatiquement des droits d'accès à l'Espace
              Président. Laissez sur « Non assigné pour le moment » si la présidence n'est pas encore établie.
            </p>
          </div>

          {/* Mandat Universitaire (Menu Déroulant Sécurisé) */}
          <div className="space-y-1.5">
            <Label htmlFor="annees_etude">Mandat (Année universitaire) *</Label>
            <select
              id="annees_etude"
              value={form.annees_etude}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, annees_etude: e.target.value }));
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.annees_etude;
                  return next;
                });
              }}
              className={cn(
                'w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm shadow-sm transition focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-800',
                fieldErrors.annees_etude && 'border-red-500 bg-red-50/20'
              )}
            >
              {MANDAT_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} {m === DEFAULT_MANDAT ? '(Mandat actuel)' : ''}
                </option>
              ))}
            </select>
            {fieldErrors.annees_etude && (
              <p className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {fieldErrors.annees_etude}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Présentation & Objectifs</Label>
            <Textarea
              id="description"
              placeholder="Décrivez la vocation du club, ses projets phares et ses pôles d'activités..."
              rows={3}
              value={form.description}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, description: e.target.value }));
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.description;
                  return next;
                });
              }}
              className={cn(fieldErrors.description && 'border-red-500 bg-red-50/20')}
            />
            {fieldErrors.description && (
              <p className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {fieldErrors.description}
              </p>
            )}
          </div>

          {/* Logo / Image */}
          <div className="space-y-1.5">
            <Label htmlFor="logo">Logo du club (JPG / PNG / WebP, max 5 Mo)</Label>
            <div className="flex items-center gap-3">
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setLogoFile(e.target.files[0]);
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.logo;
                      return next;
                    });
                  }
                }}
                className={cn(fieldErrors.logo && 'border-red-500 bg-red-50/20')}
              />
            </div>
            {fieldErrors.logo && (
              <p className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {fieldErrors.logo}
              </p>
            )}
          </div>

          {/* Coordonnées & Membres */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email de contact</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@adei-ensaf.ma"
                value={form.email}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, email: e.target.value }));
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.email;
                    return next;
                  });
                }}
                className={cn(fieldErrors.email && 'border-red-500 bg-red-50/20 focus-visible:ring-red-500')}
              />
              {fieldErrors.email && (
                <p className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tel">Téléphone</Label>
              <Input
                id="tel"
                placeholder="+212 6..."
                value={form.tel}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, tel: e.target.value }));
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.tel;
                    return next;
                  });
                }}
                className={cn(fieldErrors.tel && 'border-red-500 bg-red-50/20 focus-visible:ring-red-500')}
              />
              {fieldErrors.tel && (
                <p className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldErrors.tel}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="members">Nombre d'adhérents</Label>
              <Input
                id="members"
                type="number"
                min="0"
                value={form.members}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, members: e.target.value }));
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.members;
                    return next;
                  });
                }}
                className={cn(fieldErrors.members && 'border-red-500 bg-red-50/20 focus-visible:ring-red-500')}
              />
              {fieldErrors.members && (
                <p className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldErrors.members}
                </p>
              )}
            </div>
          </div>

          {/* Activités & Réalisations (séparées par virgules) */}
          <div className="space-y-1.5">
            <Label htmlFor="activities">Activités (séparées par des virgules)</Label>
            <Input
              id="activities"
              placeholder="Ateliers, Hackathons, Formations, Conférences..."
              value={form.activities}
              onChange={(e) => setForm((prev) => ({ ...prev, activities: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="achievements">Réalisations majeures (séparées par des virgules)</Label>
            <Input
              id="achievements"
              placeholder="1er Prix National, Organisation Journée Métiers..."
              value={form.achievements}
              onChange={(e) => setForm((prev) => ({ ...prev, achievements: e.target.value }))}
            />
          </div>

          {/* Réseaux sociaux */}
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Réseaux & Liens Web</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Input
                  placeholder="Site web (https://...)"
                  value={form.website}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, website: e.target.value }));
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.website;
                      return next;
                    });
                  }}
                  className={cn(fieldErrors.website && 'border-red-500 bg-red-50/20')}
                />
                {fieldErrors.website && (
                  <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                    {fieldErrors.website}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Input
                  placeholder="Instagram (https://...)"
                  value={form.instagram}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, instagram: e.target.value }));
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.instagram;
                      return next;
                    });
                  }}
                  className={cn(fieldErrors.instagram && 'border-red-500 bg-red-50/20')}
                />
                {fieldErrors.instagram && (
                  <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                    {fieldErrors.instagram}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Input
                  placeholder="LinkedIn (https://...)"
                  value={form.linkedin}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, linkedin: e.target.value }));
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.linkedin;
                      return next;
                    });
                  }}
                  className={cn(fieldErrors.linkedin && 'border-red-500 bg-red-50/20')}
                />
                {fieldErrors.linkedin && (
                  <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                    {fieldErrors.linkedin}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Input
                  placeholder="Facebook (https://...)"
                  value={form.facebook}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, facebook: e.target.value }));
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.facebook;
                      return next;
                    });
                  }}
                  className={cn(fieldErrors.facebook && 'border-red-500 bg-red-50/20')}
                />
                {fieldErrors.facebook && (
                  <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                    {fieldErrors.facebook}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingClub ? 'Enregistrer les modifications' : 'Créer le club'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODALE REJET DE MODIFICATION */}
      <Modal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Refuser les modifications proposées"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Veuillez indiquer le motif du refus. Cette explication sera automatiquement adressée au président par email
            pour lui permettre d'ajuster sa proposition.
          </p>

          <Textarea
            placeholder="Ex : Veuillez joindre un logo officiel en haute résolution ou reformuler les objectifs..."
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="outline"
              disabled={rejectMutation.isPending}
              onClick={() => {
                if (targetClubId) {
                  rejectMutation.mutate({ id: targetClubId, reason: rejectionReason });
                }
              }}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/40"
            >
              {rejectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Confirmer le refus
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODALE CONFIRMATION DE SUPPRESSION */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Supprimer définitivement ce club"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Êtes-vous certain de vouloir supprimer ce club ? Cette action est irréversible et supprimera également les
            associations de membres rattachées.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="outline"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deletingId) deleteMutation.mutate(deletingId);
              }}
              className="border-red-200 bg-red-600 text-white hover:bg-red-700"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Supprimer le club
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
