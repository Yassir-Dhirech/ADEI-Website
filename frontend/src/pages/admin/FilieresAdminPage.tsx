import { useState, useMemo, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  Search,
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
  FileText,
  UserCheck,
  AlertCircle,
  Loader2,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import type { FiliereItem, User } from '@/types/api';
import { Modal } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export function FilieresAdminPage() {
  const queryClient = useQueryClient();
  const [cycleFilter, setCycleFilter] = useState<'all' | 'filiere' | 'prepa'>('all');
  const [search, setSearch] = useState('');

  // Modale Création / Édition
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFiliere, setEditingFiliere] = useState<FiliereItem | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    abbreviation: '',
    type: 'filiere' as 'filiere' | 'prepa',
    description: '',
    documentation: '',
    drive: '',
    responsable_pedagogique: '',
    responsable_contact: '',
    isActive: true,

    // Délégués Cycle Ingénieur
    delegue_annee1: '',
    tel_delegue_annee1: '',
    delegue_annee2: '',
    tel_delegue_annee2: '',
    delegue_annee3: '',
    tel_delegue_annee3: '',

    // Délégués Prépa
    delegue_cp1_a: '',
    tel_delegue_cp1_a: '',
    delegue_cp1_b: '',
    tel_delegue_cp1_b: '',
    delegue_cp1_c: '',
    tel_delegue_cp1_c: '',
    delegue_cp2_a: '',
    tel_delegue_cp2_a: '',
    delegue_cp2_b: '',
    tel_delegue_cp2_b: '',
    delegue_cp2_c: '',
    tel_delegue_cp2_c: ''
  });

  // Gestion des erreurs par champ
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Modale Suppression
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 1. Récupération des filières
  const { data: filieresRes, isLoading: filieresLoading } = useQuery({
    queryKey: ['admin', 'filieres'],
    queryFn: () => apiRequest<FiliereItem[]>('/filieres')
  });
  const filieres = filieresRes?.data || [];

  // 2. Récupération des utilisateurs pour l'assignation des délégués
  const { data: usersRes } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => apiRequest<User[]>('/users')
  });
  const users = usersRes?.data || [];

  // Filtrage
  const filteredFilieres = useMemo(() => {
    const q = search.trim().toLowerCase();
    return filieres.filter((f) => {
      const matchesCycle = cycleFilter === 'all' || f.type === cycleFilter;
      const matchesSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.abbreviation.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q)) ||
        (f.responsable_pedagogique && f.responsable_pedagogique.toLowerCase().includes(q)) ||
        (f.delegue_annee1 && f.delegue_annee1.toLowerCase().includes(q)) ||
        (f.delegue_annee2 && f.delegue_annee2.toLowerCase().includes(q)) ||
        (f.delegue_annee3 && f.delegue_annee3.toLowerCase().includes(q));
      return matchesCycle && matchesSearch;
    });
  }, [filieres, cycleFilter, search]);

  const invalidateFilieres = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'filieres'] });
    void queryClient.invalidateQueries({ queryKey: ['filieres'] });
  };

  // Validation stricte du formulaire
  const validateForm = () => {
    const errs: Record<string, string> = {};

    const trimmedName = form.name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      errs.name = 'Le nom de la filière doit contenir au moins 2 caractères.';
    }

    const trimmedAbbr = form.abbreviation.trim();
    if (!trimmedAbbr || trimmedAbbr.length < 1) {
      errs.abbreviation = "L'abréviation est requise (ex: GI, GTR, CP).";
    }

    const urlRegex = /^https?:\/\/.+/i;
    if (form.drive && form.drive.trim() !== '' && !urlRegex.test(form.drive.trim())) {
      errs.drive = 'Le lien Drive doit débuter par https:// ou http://';
    }
    if (form.documentation && form.documentation.trim() !== '' && !urlRegex.test(form.documentation.trim())) {
      errs.documentation = 'Le descriptif doit être une URL valide (https:// ou http://)';
    }

    return errs;
  };

  // Mutation Sauvegarde
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        abbreviation: form.abbreviation.trim().toUpperCase(),
        type: form.type,
        description: form.description.trim() || null,
        documentation: form.documentation.trim() || null,
        drive: form.drive.trim() || null,
        responsable_pedagogique: form.responsable_pedagogique.trim() || null,
        responsable_contact: form.responsable_contact.trim() || null,
        isActive: form.isActive
      };

      if (form.type === 'filiere') {
        payload.delegue_annee1 = form.delegue_annee1.trim() || null;
        payload.tel_delegue_annee1 = form.tel_delegue_annee1.trim() || null;
        payload.delegue_annee2 = form.delegue_annee2.trim() || null;
        payload.tel_delegue_annee2 = form.tel_delegue_annee2.trim() || null;
        payload.delegue_annee3 = form.delegue_annee3.trim() || null;
        payload.tel_delegue_annee3 = form.tel_delegue_annee3.trim() || null;
      } else {
        payload.delegue_cp1_a = form.delegue_cp1_a.trim() || null;
        payload.tel_delegue_cp1_a = form.tel_delegue_cp1_a.trim() || null;
        payload.delegue_cp1_b = form.delegue_cp1_b.trim() || null;
        payload.tel_delegue_cp1_b = form.tel_delegue_cp1_b.trim() || null;
        payload.delegue_cp1_c = form.delegue_cp1_c.trim() || null;
        payload.tel_delegue_cp1_c = form.tel_delegue_cp1_c.trim() || null;
        payload.delegue_cp2_a = form.delegue_cp2_a.trim() || null;
        payload.tel_delegue_cp2_a = form.tel_delegue_cp2_a.trim() || null;
        payload.delegue_cp2_b = form.delegue_cp2_b.trim() || null;
        payload.tel_delegue_cp2_b = form.tel_delegue_cp2_b.trim() || null;
        payload.delegue_cp2_c = form.delegue_cp2_c.trim() || null;
        payload.tel_delegue_cp2_c = form.tel_delegue_cp2_c.trim() || null;
      }

      if (editingFiliere) {
        return apiRequest(`/filieres/${editingFiliere.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        return apiRequest('/filieres', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
    },
    onSuccess: () => {
      toast.success(editingFiliere ? 'Filière mise à jour avec succès !' : 'Nouvelle filière créée avec succès !');
      setModalOpen(false);
      setEditingFiliere(null);
      setFieldErrors({});
      invalidateFilieres();
    },
    onError: (err: unknown) => {
      const anyErr = err as { details?: Array<{ field?: string; message: string }>; message?: string };
      if (anyErr?.details && Array.isArray(anyErr.details)) {
        const mapped: Record<string, string> = {};
        anyErr.details.forEach((d) => {
          if (d.field) mapped[d.field] = d.message;
        });
        setFieldErrors(mapped);
        toast.error('Certains champs sont invalides selon le serveur.');
      } else {
        toast.error(anyErr?.message || "Erreur lors de l'enregistrement de la filière");
      }
    }
  });

  // Mutation Suppression
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/filieres/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast.success('Filière supprimée avec succès !');
      setDeleteModalOpen(false);
      setDeletingId(null);
      invalidateFilieres();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  });

  const handleOpenCreate = () => {
    setEditingFiliere(null);
    setForm({
      name: '',
      abbreviation: '',
      type: 'filiere',
      description: '',
      documentation: '',
      drive: '',
      responsable_pedagogique: '',
      responsable_contact: '',
      isActive: true,
      delegue_annee1: '',
      tel_delegue_annee1: '',
      delegue_annee2: '',
      tel_delegue_annee2: '',
      delegue_annee3: '',
      tel_delegue_annee3: '',
      delegue_cp1_a: '',
      tel_delegue_cp1_a: '',
      delegue_cp1_b: '',
      tel_delegue_cp1_b: '',
      delegue_cp1_c: '',
      tel_delegue_cp1_c: '',
      delegue_cp2_a: '',
      tel_delegue_cp2_a: '',
      delegue_cp2_b: '',
      tel_delegue_cp2_b: '',
      delegue_cp2_c: '',
      tel_delegue_cp2_c: ''
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  const handleOpenEdit = (f: FiliereItem) => {
    setEditingFiliere(f);
    setForm({
      name: f.name,
      abbreviation: f.abbreviation,
      type: f.type || 'filiere',
      description: f.description || '',
      documentation: f.documentation || '',
      drive: f.drive || '',
      responsable_pedagogique: f.responsable_pedagogique || '',
      responsable_contact: f.responsable_contact || '',
      isActive: f.isActive ?? true,
      delegue_annee1: f.delegue_annee1 || '',
      tel_delegue_annee1: f.tel_delegue_annee1 || '',
      delegue_annee2: f.delegue_annee2 || '',
      tel_delegue_annee2: f.tel_delegue_annee2 || '',
      delegue_annee3: f.delegue_annee3 || '',
      tel_delegue_annee3: f.tel_delegue_annee3 || '',
      delegue_cp1_a: f.delegue_cp1_a || '',
      tel_delegue_cp1_a: f.tel_delegue_cp1_a || '',
      delegue_cp1_b: f.delegue_cp1_b || '',
      tel_delegue_cp1_b: f.tel_delegue_cp1_b || '',
      delegue_cp1_c: f.delegue_cp1_c || '',
      tel_delegue_cp1_c: f.tel_delegue_cp1_c || '',
      delegue_cp2_a: f.delegue_cp2_a || '',
      tel_delegue_cp2_a: f.tel_delegue_cp2_a || '',
      delegue_cp2_b: f.delegue_cp2_b || '',
      tel_delegue_cp2_b: f.tel_delegue_cp2_b || '',
      delegue_cp2_c: f.delegue_cp2_c || '',
      tel_delegue_cp2_c: f.tel_delegue_cp2_c || ''
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  // Helper pour l'assignation d'un délégué par Nom & Prénom
  const handleDelegateSelect = (fieldName: string, telFieldName: string, userName: string) => {
    if (userName === 'none' || !userName) {
      setForm((prev) => ({
        ...prev,
        [fieldName]: '',
        [telFieldName]: ''
      }));
    } else {
      const selectedUser = users.find((u) => u.username === userName);
      setForm((prev) => ({
        ...prev,
        [fieldName]: userName,
        [telFieldName]: selectedUser?.phone || prev[telFieldName as keyof typeof prev] || ''
      }));
    }
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
      {/* En-tête Institutionnel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Gestion des Filières & Délégués
          </h1>
          <p className="text-sm text-zinc-500">
            Administration des spécialités, des cycles d'études et assignation des délégués de promotion.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Nouvelle Filière
        </Button>
      </div>

      {/* Onglets et Recherche */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={cycleFilter} onValueChange={(v) => setCycleFilter(v as 'all' | 'filiere' | 'prepa')}>
          <TabsList className="bg-zinc-100 dark:bg-zinc-800">
            <TabsTrigger value="all" className="gap-2">
              <GraduationCap className="h-4 w-4" /> Toutes ({filieres.length})
            </TabsTrigger>
            <TabsTrigger value="filiere" className="gap-2">
              Cycle Ingénieur ({filieres.filter((f) => f.type === 'filiere').length})
            </TabsTrigger>
            <TabsTrigger value="prepa" className="gap-2">
              Cycle Prépa ({filieres.filter((f) => f.type === 'prepa').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Rechercher (GI, GTR, CP, délégué...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Grille des Filières */}
      {filieresLoading ? (
        <div className="flex items-center justify-center py-20 text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Chargement des filières...
        </div>
      ) : filteredFilieres.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 py-16 text-center text-sm text-zinc-500 dark:border-zinc-800">
          Aucune filière trouvée pour les critères sélectionnés.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredFilieres.map((filiere) => {
            const isPrepa = filiere.type === 'prepa';

            return (
              <div
                key={filiere.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-red-500/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  {/* Header de la carte */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1 text-xs font-black tracking-wider text-white shadow-sm">
                      <GraduationCap className="h-3.5 w-3.5" /> {filiere.abbreviation}
                    </span>
                    <Badge variant={isPrepa ? 'outline' : 'secondary'} className="text-xs">
                      {isPrepa ? 'Classes Prépa' : 'Cycle Ingénieur'}
                    </Badge>
                  </div>

                  {/* Nom & Description */}
                  <h3 className="mt-3 text-base font-bold text-zinc-900 group-hover:text-red-600 dark:text-zinc-50">
                    {filiere.name}
                  </h3>

                  {filiere.description && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {filiere.description}
                    </p>
                  )}

                  {/* Responsable Pédagogique */}
                  {filiere.responsable_pedagogique && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
                      <UserCheck className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      <span className="truncate">
                        Resp. : <strong>{filiere.responsable_pedagogique}</strong>
                        {filiere.responsable_contact ? ` (${filiere.responsable_contact})` : ''}
                      </span>
                    </div>
                  )}

                  {/* Bloc Délégués de Promotion */}
                  <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 space-y-1.5 dark:border-zinc-800/80 dark:bg-zinc-900/60">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                      <Users className="h-3 w-3" /> Délégués de promotion
                    </p>

                    {isPrepa ? (
                      <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-semibold text-zinc-500">CP1 :</span>
                          <span className="truncate max-w-[190px]">
                            {filiere.delegue_cp1_a || filiere.delegue_cp1_b || filiere.delegue_cp1_c ? (
                              [filiere.delegue_cp1_a, filiere.delegue_cp1_b, filiere.delegue_cp1_c]
                                .filter(Boolean)
                                .join(' • ')
                            ) : (
                              <span className="italic text-zinc-400">Non assigné pour le moment</span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-semibold text-zinc-500">CP2 :</span>
                          <span className="truncate max-w-[190px]">
                            {filiere.delegue_cp2_a || filiere.delegue_cp2_b || filiere.delegue_cp2_c ? (
                              [filiere.delegue_cp2_a, filiere.delegue_cp2_b, filiere.delegue_cp2_c]
                                .filter(Boolean)
                                .join(' • ')
                            ) : (
                              <span className="italic text-zinc-400">Non assigné pour le moment</span>
                            )}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-semibold text-zinc-500">1ère Année :</span>
                          <span className="truncate max-w-[180px]">
                            {filiere.delegue_annee1 || <span className="italic text-zinc-400">Non assigné</span>}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-semibold text-zinc-500">2ème Année :</span>
                          <span className="truncate max-w-[180px]">
                            {filiere.delegue_annee2 || <span className="italic text-zinc-400">Non assigné</span>}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-semibold text-zinc-500">3ème Année :</span>
                          <span className="truncate max-w-[180px]">
                            {filiere.delegue_annee3 || <span className="italic text-zinc-400">Non assigné</span>}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Liens et Actions */}
                <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    {filiere.drive && (
                      <a
                        href={filiere.drive}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400"
                        title="Ouvrir le Drive de cours"
                      >
                        <FolderOpen className="h-3 w-3" /> Drive
                      </a>
                    )}
                    {filiere.documentation && (
                      <a
                        href={filiere.documentation}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400"
                        title="Ouvrir le descriptif"
                      >
                        <FileText className="h-3 w-3" /> Descriptif
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(filiere)}
                      className="h-8 gap-1 px-2.5 text-xs"
                    >
                      <Pencil className="h-3 w-3" /> Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeletingId(filiere.id);
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

      {/* MODALE CRÉATION & ÉDITION */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingFiliere ? `Modifier la filière : ${editingFiliere.abbreviation}` : 'Créer une nouvelle filière'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
          {/* Cycle & Abréviation */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="filiereName">Intitulé de la filière *</Label>
              <Input
                id="filiereName"
                placeholder="ex: Génie Informatique, Génie Mécanique..."
                value={form.name}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, name: e.target.value }));
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.name;
                    return next;
                  });
                }}
                className={cn(fieldErrors.name && 'border-red-500 bg-red-50/20')}
                required
              />
              {fieldErrors.name && (
                <p className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="abbreviation">Abréviation *</Label>
              <Input
                id="abbreviation"
                placeholder="ex: GI, GTR, CP"
                value={form.abbreviation}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, abbreviation: e.target.value.toUpperCase() }));
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.abbreviation;
                    return next;
                  });
                }}
                className={cn(fieldErrors.abbreviation && 'border-red-500 bg-red-50/20')}
                required
              />
              {fieldErrors.abbreviation && (
                <p className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldErrors.abbreviation}
                </p>
              )}
            </div>
          </div>

          {/* Type de cycle */}
          <div className="space-y-1.5">
            <Label htmlFor="typeSelect">Type de cycle *</Label>
            <select
              id="typeSelect"
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as 'filiere' | 'prepa' }))}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm shadow-sm transition focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="filiere">Cycle Ingénieur (Spécialité)</option>
              <option value="prepa">Cycle Préparatoire Intégré (Classes Prépa)</option>
            </select>
          </div>

          {/* Responsable Pédagogique */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="respPedago">Responsable Pédagogique</Label>
              <Input
                id="respPedago"
                placeholder="Nom du coordonnateur (Pr. ...)"
                value={form.responsable_pedagogique}
                onChange={(e) => setForm((prev) => ({ ...prev, responsable_pedagogique: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="respContact">Contact du Responsable</Label>
              <Input
                id="respContact"
                placeholder="Email ou téléphone"
                value={form.responsable_contact}
                onChange={(e) => setForm((prev) => ({ ...prev, responsable_contact: e.target.value }))}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="filiereDesc">Présentation & Compétences visées</Label>
            <Textarea
              id="filiereDesc"
              placeholder="Décrivez les objectifs académiques, les débouchés professionnels et les compétences..."
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Liens Drive & Documentation */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="driveUrl">Lien Drive des cours (Google Drive / OneDrive)</Label>
              <Input
                id="driveUrl"
                placeholder="https://drive.google.com/..."
                value={form.drive}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, drive: e.target.value }));
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.drive;
                    return next;
                  });
                }}
                className={cn(fieldErrors.drive && 'border-red-500 bg-red-50/20')}
              />
              {fieldErrors.drive && (
                <p className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldErrors.drive}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="docUrl">Lien du descriptif officiel (PDF / Page)</Label>
              <Input
                id="docUrl"
                placeholder="https://..."
                value={form.documentation}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, documentation: e.target.value }));
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.documentation;
                    return next;
                  });
                }}
                className={cn(fieldErrors.documentation && 'border-red-500 bg-red-50/20')}
              />
              {fieldErrors.documentation && (
                <p className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldErrors.documentation}
                </p>
              )}
            </div>
          </div>

          {/* ASSIGNATION DES DÉLÉGUÉS (NOM & PRÉNOM UNIQUEMENT) */}
          <Separator />
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 space-y-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100">
                <Users className="h-4 w-4 text-red-600" />
                Assignation des Délégués de Promotion
              </Label>
              <span className="text-xs text-zinc-400">Sélection par Nom & Prénom</span>
            </div>

            {form.type === 'filiere' ? (
              /* DÉLÉGUÉS CYCLE INGÉNIEUR */
              <div className="space-y-3">
                {/* 1ère Année */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Délégué 1ère Année (Nom & Prénom)</Label>
                    <select
                      value={form.delegue_annee1}
                      onChange={(e) => handleDelegateSelect('delegue_annee1', 'tel_delegue_annee1', e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs shadow-sm transition focus:border-red-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      <option value="none">-- Non assigné pour le moment --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.username}>
                          {u.username}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Téléphone 1ère Année</Label>
                    <Input
                      placeholder="+212 6..."
                      value={form.tel_delegue_annee1}
                      onChange={(e) => setForm((prev) => ({ ...prev, tel_delegue_annee1: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* 2ème Année */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Délégué 2ème Année (Nom & Prénom)</Label>
                    <select
                      value={form.delegue_annee2}
                      onChange={(e) => handleDelegateSelect('delegue_annee2', 'tel_delegue_annee2', e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs shadow-sm transition focus:border-red-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      <option value="none">-- Non assigné pour le moment --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.username}>
                          {u.username}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Téléphone 2ème Année</Label>
                    <Input
                      placeholder="+212 6..."
                      value={form.tel_delegue_annee2}
                      onChange={(e) => setForm((prev) => ({ ...prev, tel_delegue_annee2: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* 3ème Année */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Délégué 3ème Année (Nom & Prénom)</Label>
                    <select
                      value={form.delegue_annee3}
                      onChange={(e) => handleDelegateSelect('delegue_annee3', 'tel_delegue_annee3', e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs shadow-sm transition focus:border-red-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      <option value="none">-- Non assigné pour le moment --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.username}>
                          {u.username}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Téléphone 3ème Année</Label>
                    <Input
                      placeholder="+212 6..."
                      value={form.tel_delegue_annee3}
                      onChange={(e) => setForm((prev) => ({ ...prev, tel_delegue_annee3: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* DÉLÉGUÉS CYCLE PRÉPARATOIRE (SECTIONS A, B, C) */
              <div className="space-y-4">
                {/* CP1 */}
                <div className="space-y-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
                  <p className="text-xs font-bold text-red-600">Première Année (CP1)</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Section A</Label>
                      <select
                        value={form.delegue_cp1_a}
                        onChange={(e) => handleDelegateSelect('delegue_cp1_a', 'tel_delegue_cp1_a', e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-1 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
                      >
                        <option value="none">-- Non assigné --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.username}>
                            {u.username}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Section B</Label>
                      <select
                        value={form.delegue_cp1_b}
                        onChange={(e) => handleDelegateSelect('delegue_cp1_b', 'tel_delegue_cp1_b', e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-1 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
                      >
                        <option value="none">-- Non assigné --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.username}>
                            {u.username}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Section C</Label>
                      <select
                        value={form.delegue_cp1_c}
                        onChange={(e) => handleDelegateSelect('delegue_cp1_c', 'tel_delegue_cp1_c', e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-1 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
                      >
                        <option value="none">-- Non assigné --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.username}>
                            {u.username}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* CP2 */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-red-600">Deuxième Année (CP2)</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Section A</Label>
                      <select
                        value={form.delegue_cp2_a}
                        onChange={(e) => handleDelegateSelect('delegue_cp2_a', 'tel_delegue_cp2_a', e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-1 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
                      >
                        <option value="none">-- Non assigné --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.username}>
                            {u.username}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Section B</Label>
                      <select
                        value={form.delegue_cp2_b}
                        onChange={(e) => handleDelegateSelect('delegue_cp2_b', 'tel_delegue_cp2_b', e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-1 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
                      >
                        <option value="none">-- Non assigné --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.username}>
                            {u.username}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Section C</Label>
                      <select
                        value={form.delegue_cp2_c}
                        onChange={(e) => handleDelegateSelect('delegue_cp2_c', 'tel_delegue_cp2_c', e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-1 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
                      >
                        <option value="none">-- Non assigné --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.username}>
                            {u.username}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingFiliere ? 'Enregistrer les modifications' : 'Créer la filière'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODALE CONFIRMATION DE SUPPRESSION */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Supprimer cette filière"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Êtes-vous certain de vouloir supprimer cette filière ? Cette action est irréversible.
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
              Supprimer la filière
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
