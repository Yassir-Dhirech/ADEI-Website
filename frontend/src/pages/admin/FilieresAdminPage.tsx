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
  Users,
  PlusCircle,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import type { FiliereItem, User, DriveLink } from '@/types/api';
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
    responsable_pedagogique: '',
    responsable_contact: '',
    isActive: true,

    // Délégués Cycle Ingénieur (1 délégué par année)
    delegue_annee1: '',
    tel_delegue_annee1: '',
    delegue_annee2: '',
    tel_delegue_annee2: '',
    delegue_annee3: '',
    tel_delegue_annee3: '',

    // Délégués Prépa (2 années x 3 sections = 6 délégués)
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

  // Gestion multi-drives par année : { "1A": [{label, url}], "2A": [...], "CP1": [...] }
  const [drivesByYear, setDrivesByYear] = useState<Record<string, DriveLink[]>>({
    '1A': [],
    '2A': [],
    '3A': [],
    'CP1': [],
    'CP2': []
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

  // Gestion des Drives par année
  const handleAddDrive = (yearKey: string) => {
    setDrivesByYear((prev) => ({
      ...prev,
      [yearKey]: [...(prev[yearKey] || []), { label: `Drive ${yearKey}`, url: '' }]
    }));
  };

  const handleUpdateDrive = (yearKey: string, index: number, field: 'label' | 'url', val: string) => {
    setDrivesByYear((prev) => {
      const list = [...(prev[yearKey] || [])];
      if (list[index]) {
        list[index] = { ...list[index], [field]: val };
      }
      return { ...prev, [yearKey]: list };
    });
  };

  const handleRemoveDrive = (yearKey: string, index: number) => {
    setDrivesByYear((prev) => ({
      ...prev,
      [yearKey]: (prev[yearKey] || []).filter((_, i) => i !== index)
    }));
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
    if (form.documentation && form.documentation.trim() !== '' && !urlRegex.test(form.documentation.trim())) {
      errs.documentation = 'Le descriptif officiel doit débuter par https:// ou http://';
    }

    // Valider les URLs des drives saisis
    const relevantYears = form.type === 'filiere' ? ['1A', '2A', '3A'] : ['CP1', 'CP2'];
    for (const year of relevantYears) {
      const yearDrives = drivesByYear[year] || [];
      yearDrives.forEach((d, idx) => {
        if (d.url.trim() && !urlRegex.test(d.url.trim())) {
          errs[`drive_${year}_${idx}`] = `L'URL du Drive ${year} doit débuter par https:// ou http://`;
        }
      });
    }

    return errs;
  };

  // Mutation Sauvegarde
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Filtrer et nettoyer les drives par année selon le type
      const relevantYears = form.type === 'filiere' ? ['1A', '2A', '3A'] : ['CP1', 'CP2'];
      const cleanedDrives: Record<string, DriveLink[]> = {};
      for (const year of relevantYears) {
        cleanedDrives[year] = (drivesByYear[year] || []).filter((d) => d.url && d.url.trim().length > 0);
      }

      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        abbreviation: form.abbreviation.trim().toUpperCase(),
        type: form.type,
        description: form.description.trim() || null,
        documentation: form.documentation.trim() || null,
        drives: cleanedDrives,
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
    setDrivesByYear({
      '1A': [],
      '2A': [],
      '3A': [],
      'CP1': [],
      'CP2': []
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

    // Chargement des drives existants
    const existingDrives = (f.drives || {}) as Record<string, DriveLink[]>;
    setDrivesByYear({
      '1A': existingDrives['1A'] || (f.drive && f.type === 'filiere' ? [{ label: 'Drive 1A', url: f.drive }] : []),
      '2A': existingDrives['2A'] || [],
      '3A': existingDrives['3A'] || [],
      'CP1': existingDrives['CP1'] || (f.drive && f.type === 'prepa' ? [{ label: 'Drive CP1', url: f.drive }] : []),
      'CP2': existingDrives['CP2'] || []
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
            Administration des spécialités, des coordinateurs, multi-drives par année et délégués de promotion.
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
            placeholder="Rechercher (GI, GTR, CP, coordinateur, délégué...)"
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
            const fDrives = (filiere.drives || {}) as Record<string, DriveLink[]>;

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
                      {isPrepa ? 'Classes Prépa (2 ans)' : 'Cycle Ingénieur (3 ans)'}
                    </Badge>
                  </div>

                  {/* Nom & Description globale */}
                  <h3 className="mt-3 text-base font-bold text-zinc-900 group-hover:text-red-600 dark:text-zinc-50">
                    {filiere.name}
                  </h3>

                  {filiere.description && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {filiere.description}
                    </p>
                  )}

                  {/* Professeur Coordinateur */}
                  {filiere.responsable_pedagogique && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
                      <UserCheck className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      <span className="truncate">
                        Coordinateur : <strong>{filiere.responsable_pedagogique}</strong>
                        {filiere.responsable_contact ? ` (${filiere.responsable_contact})` : ''}
                      </span>
                    </div>
                  )}

                  {/* Bloc Délégués de Promotion */}
                  <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 space-y-1.5 dark:border-zinc-800/80 dark:bg-zinc-900/60">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                      <Users className="h-3 w-3" /> Délégués par promotion
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
                              <span className="italic text-zinc-400">Non assigné</span>
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
                              <span className="italic text-zinc-400">Non assigné</span>
                            )}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-semibold text-zinc-500">1A :</span>
                          <span className="truncate max-w-[190px]">
                            {filiere.delegue_annee1 || <span className="italic text-zinc-400">Non assigné</span>}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-semibold text-zinc-500">2A :</span>
                          <span className="truncate max-w-[190px]">
                            {filiere.delegue_annee2 || <span className="italic text-zinc-400">Non assigné</span>}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-semibold text-zinc-500">3A :</span>
                          <span className="truncate max-w-[190px]">
                            {filiere.delegue_annee3 || <span className="italic text-zinc-400">Non assigné</span>}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bloc Drives par année */}
                  <div className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 space-y-1.5 dark:border-zinc-800/80 dark:bg-zinc-900/60">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                      <FolderOpen className="h-3 w-3" /> Drives configurés par année
                    </p>
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      {isPrepa ? (
                        <>
                          <span className="inline-flex items-center gap-1 rounded bg-zinc-200/60 px-2 py-0.5 text-[11px] font-medium dark:bg-zinc-800">
                            CP1 : {(fDrives['CP1'] || []).length} drive(s)
                          </span>
                          <span className="inline-flex items-center gap-1 rounded bg-zinc-200/60 px-2 py-0.5 text-[11px] font-medium dark:bg-zinc-800">
                            CP2 : {(fDrives['CP2'] || []).length} drive(s)
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1 rounded bg-zinc-200/60 px-2 py-0.5 text-[11px] font-medium dark:bg-zinc-800">
                            1A : {(fDrives['1A'] || []).length} drive(s)
                          </span>
                          <span className="inline-flex items-center gap-1 rounded bg-zinc-200/60 px-2 py-0.5 text-[11px] font-medium dark:bg-zinc-800">
                            2A : {(fDrives['2A'] || []).length} drive(s)
                          </span>
                          <span className="inline-flex items-center gap-1 rounded bg-zinc-200/60 px-2 py-0.5 text-[11px] font-medium dark:bg-zinc-800">
                            3A : {(fDrives['3A'] || []).length} drive(s)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Liens et Actions */}
                <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5">
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
          {/* Section 1 : Informations Générales de la Filière */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              1. Informations Générales & Pédagogie (Communes aux promotions)
            </h3>

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
                <option value="filiere">Cycle Ingénieur (1A, 2A, 3A)</option>
                <option value="prepa">Cycle Préparatoire Intégré (CP1, CP2 avec 3 sections)</option>
              </select>
            </div>

            {/* Professeur Coordinateur */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="respPedago">Professeur Coordinateur</Label>
                <Input
                  id="respPedago"
                  placeholder="Pr. Nom & Prénom"
                  value={form.responsable_pedagogique}
                  onChange={(e) => setForm((prev) => ({ ...prev, responsable_pedagogique: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="respContact">Contact du Coordinateur</Label>
                <Input
                  id="respContact"
                  placeholder="Email académique ou téléphone"
                  value={form.responsable_contact}
                  onChange={(e) => setForm((prev) => ({ ...prev, responsable_contact: e.target.value }))}
                />
              </div>
            </div>

            {/* Description globale */}
            <div className="space-y-1.5">
              <Label htmlFor="filiereDesc">Description globale de la filière (partagée pour les 3 années)</Label>
              <Textarea
                id="filiereDesc"
                placeholder="Présentation générale de la formation, compétences et débouchés..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Descriptif officiel */}
            <div className="space-y-1.5">
              <Label htmlFor="docUrl">Lien du descriptif officiel / syllabus (PDF ou web)</Label>
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

          <Separator />

          {/* Section 2 : Année par Année (Délégué + Multi-Drives) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              2. Organisation par Année : Délégué & Liens Drive (Multiples)
            </h3>

            {form.type === 'filiere' ? (
              /* CYCLE INGÉNIEUR : 1A, 2A, 3A */
              <div className="space-y-4">
                {(['1A', '2A', '3A'] as const).map((year) => {
                  const delegueKey = year === '1A' ? 'delegue_annee1' : year === '2A' ? 'delegue_annee2' : 'delegue_annee3';
                  const telKey = year === '1A' ? 'tel_delegue_annee1' : year === '2A' ? 'tel_delegue_annee2' : 'tel_delegue_annee3';
                  const yearDrives = drivesByYear[year] || [];

                  return (
                    <div
                      key={year}
                      className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 space-y-3 dark:border-zinc-800 dark:bg-zinc-900/50"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
                        <span className="font-bold text-sm text-red-600">{year} — Promotion</span>
                        <span className="text-xs text-zinc-400">1 délégué & ses drives</span>
                      </div>

                      {/* Délégué de l'année */}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Délégué {year} (Nom & Prénom)</Label>
                          <select
                            value={form[delegueKey as keyof typeof form] as string}
                            onChange={(e) => handleDelegateSelect(delegueKey, telKey, e.target.value)}
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
                          <Label className="text-xs">Téléphone Délégué {year}</Label>
                          <Input
                            placeholder="+212 6..."
                            value={form[telKey as keyof typeof form] as string}
                            onChange={(e) => setForm((prev) => ({ ...prev, [telKey]: e.target.value }))}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      {/* Gestion des Drives de cette année */}
                      <div className="pt-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                            <FolderOpen className="h-3.5 w-3.5 text-red-600" /> Liens Drive pour la {year}
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddDrive(year)}
                            className="h-7 text-xs text-red-600 hover:text-red-700"
                          >
                            <PlusCircle className="h-3.5 w-3.5 mr-1" /> Ajouter un Drive
                          </Button>
                        </div>

                        {yearDrives.length === 0 ? (
                          <p className="text-[11px] text-zinc-400 italic">Aucun drive configuré pour la {year}.</p>
                        ) : (
                          <div className="space-y-2">
                            {yearDrives.map((drive, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Input
                                  placeholder="Intitulé (ex: Drive S1, TP...)"
                                  value={drive.label}
                                  onChange={(e) => handleUpdateDrive(year, idx, 'label', e.target.value)}
                                  className="h-8 text-xs w-1/3"
                                />
                                <Input
                                  placeholder="URL du Drive (https://drive.google.com/...)"
                                  value={drive.url}
                                  onChange={(e) => handleUpdateDrive(year, idx, 'url', e.target.value)}
                                  className={cn(
                                    'h-8 text-xs flex-1',
                                    fieldErrors[`drive_${year}_${idx}`] && 'border-red-500 bg-red-50/20'
                                  )}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveDrive(year, idx)}
                                  className="h-8 w-8 p-0 text-zinc-400 hover:text-red-600"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* CYCLE PRÉPARATOIRE : CP1 & CP2 (3 sections par année = 6 délégués + Drives par année) */
              <div className="space-y-4">
                {(['CP1', 'CP2'] as const).map((year) => {
                  const isCp1 = year === 'CP1';
                  const yearDrives = drivesByYear[year] || [];

                  return (
                    <div
                      key={year}
                      className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 space-y-3 dark:border-zinc-800 dark:bg-zinc-900/50"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
                        <span className="font-bold text-sm text-red-600">
                          {isCp1 ? 'CP1 — Première Année' : 'CP2 — Deuxième Année'}
                        </span>
                        <span className="text-xs text-zinc-400">3 sections (A, B, C) & ses drives</span>
                      </div>

                      {/* Les 3 délégués de section */}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {/* Section A */}
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold">Section A (Nom & Prénom)</Label>
                          <select
                            value={isCp1 ? form.delegue_cp1_a : form.delegue_cp2_a}
                            onChange={(e) =>
                              handleDelegateSelect(
                                isCp1 ? 'delegue_cp1_a' : 'delegue_cp2_a',
                                isCp1 ? 'tel_delegue_cp1_a' : 'tel_delegue_cp2_a',
                                e.target.value
                              )
                            }
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

                        {/* Section B */}
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold">Section B (Nom & Prénom)</Label>
                          <select
                            value={isCp1 ? form.delegue_cp1_b : form.delegue_cp2_b}
                            onChange={(e) =>
                              handleDelegateSelect(
                                isCp1 ? 'delegue_cp1_b' : 'delegue_cp2_b',
                                isCp1 ? 'tel_delegue_cp1_b' : 'tel_delegue_cp2_b',
                                e.target.value
                              )
                            }
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

                        {/* Section C */}
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold">Section C (Nom & Prénom)</Label>
                          <select
                            value={isCp1 ? form.delegue_cp1_c : form.delegue_cp2_c}
                            onChange={(e) =>
                              handleDelegateSelect(
                                isCp1 ? 'delegue_cp1_c' : 'delegue_cp2_c',
                                isCp1 ? 'tel_delegue_cp1_c' : 'tel_delegue_cp2_c',
                                e.target.value
                              )
                            }
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

                      {/* Gestion des Drives CP */}
                      <div className="pt-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                            <FolderOpen className="h-3.5 w-3.5 text-red-600" /> Liens Drive pour la {year}
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddDrive(year)}
                            className="h-7 text-xs text-red-600 hover:text-red-700"
                          >
                            <PlusCircle className="h-3.5 w-3.5 mr-1" /> Ajouter un Drive
                          </Button>
                        </div>

                        {yearDrives.length === 0 ? (
                          <p className="text-[11px] text-zinc-400 italic">Aucun drive configuré pour la {year}.</p>
                        ) : (
                          <div className="space-y-2">
                            {yearDrives.map((drive, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Input
                                  placeholder="Intitulé (ex: Drive Général, TD/TP...)"
                                  value={drive.label}
                                  onChange={(e) => handleUpdateDrive(year, idx, 'label', e.target.value)}
                                  className="h-8 text-xs w-1/3"
                                />
                                <Input
                                  placeholder="URL du Drive (https://drive.google.com/...)"
                                  value={drive.url}
                                  onChange={(e) => handleUpdateDrive(year, idx, 'url', e.target.value)}
                                  className={cn(
                                    'h-8 text-xs flex-1',
                                    fieldErrors[`drive_${year}_${idx}`] && 'border-red-500 bg-red-50/20'
                                  )}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveDrive(year, idx)}
                                  className="h-8 w-8 p-0 text-zinc-400 hover:text-red-600"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
