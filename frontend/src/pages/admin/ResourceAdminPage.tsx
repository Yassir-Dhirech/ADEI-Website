import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUp, ArrowDown, Trash2, Pencil, Plus, Search, Upload, Loader2, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest, getImageUrl } from '@/lib/api';
import { Modal } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

export interface FieldConfig {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'date' | 'number' | 'textarea' | 'file' | 'select';
  required?: boolean;
  accept?: string;
  options?: string[];
  defaultValue?: string;
}

interface ResourceAdminProps {
  title: string;
  endpoint: string;
  queryKey: string;
  titleField: string;
  subtitleField?: string;
  badgeField?: string;
  canReorder?: boolean;
  multipart?: boolean;
  fields: FieldConfig[];
}

function getRowThumbnail(item: Record<string, unknown>): string | null {
  for (const key of ['image', 'logo', 'photo']) {
    const val = item[key];
    if (typeof val === 'string' && val.trim().length > 0) return getImageUrl(val);
  }
  return null;
}

export function ResourceAdminPage({
  title,
  endpoint,
  queryKey,
  titleField,
  subtitleField,
  badgeField,
  canReorder = false,
  multipart = false,
  fields
}: ResourceAdminProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin', queryKey],
    queryFn: () => apiRequest<Array<Record<string, unknown>>>(endpoint)
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', queryKey] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'counts'] });
    void queryClient.invalidateQueries({ queryKey: [queryKey] });
  };

  const buildBody = () => {
    if (!multipart) return JSON.stringify(form);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v !== undefined && v !== '') fd.append(k, v);
    });
    Object.entries(files).forEach(([k, file]) => {
      if (file) fd.append(k, file);
    });
    return fd;
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest(editingId ? `${endpoint}/${editingId}` : endpoint, {
        method: editingId ? 'PUT' : 'POST',
        body: buildBody()
      }),
    onSuccess: () => {
      toast.success(editingId ? `${title} mis à jour !` : `Nouvel élément ajouté dans ${title} !`);
      setModalOpen(false);
      setEditingId(null);
      setForm({});
      setFiles({});
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || "Erreur lors de l'enregistrement.")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`${endpoint}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Élément supprimé.');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Impossible de supprimer.')
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, direction }: { id: number; direction: 'up' | 'down' }) =>
      apiRequest(`${endpoint}/${id}/reorder`, { method: 'PATCH', body: JSON.stringify({ direction }) }),
    onSuccess: () => {
      toast.success('Ordre mis à jour.');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message)
  });

  const openCreate = () => {
    setEditingId(null);
    const defaults: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue;
      else if (f.type === 'select' && f.options?.[0]) defaults[f.name] = f.options[0];
    });
    setForm(defaults);
    setFiles({});
    setModalOpen(true);
  };

  const openEdit = (item: Record<string, unknown>) => {
    setEditingId(Number(item.id));
    const initial: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.type === 'file' || f.type === 'password') return;
      const val = item[f.name];
      initial[f.name] = Array.isArray(val) ? val.join(', ') : String(val ?? '');
    });
    setForm(initial);
    setFiles({});
    setModalOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const allRows = data?.data ?? [];
  const rows = allRows.filter((item) =>
    `${item[titleField] ?? ''} ${subtitleField ? item[subtitleField] ?? '' : ''} ${badgeField ? item[badgeField] ?? '' : ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/90">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
            <Badge variant="secondary">{allRows.length}</Badge>
          </div>
          <p className="text-xs text-zinc-500">
            Créez, modifiez ou supprimez les entrées de cette section.
          </p>
        </div>
        <Button onClick={openCreate} className="rounded-xl bg-red-600 text-white hover:bg-red-700">
          <Plus className="h-4 w-4" /> Nouveau
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Rechercher dans ${title.toLowerCase()}…`}
          className="h-10 rounded-xl pl-9"
        />
      </div>

      {/* Rows */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-16 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white/60 py-14 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <FolderOpen className="mb-3 h-9 w-9 text-zinc-400" />
          <p className="text-sm font-semibold">Aucun élément trouvé</p>
          <p className="mt-1 text-xs text-zinc-500">Cliquez sur « Nouveau » pour ajouter une première entrée.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((item) => {
            const id = Number(item.id);
            const thumb = getRowThumbnail(item);
            return (
              <div
                key={id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white px-4 py-3.5 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-900/90 dark:hover:border-zinc-700"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  {thumb && (
                    <img
                      src={thumb}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-xl border border-zinc-200 object-cover dark:border-zinc-700"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">{String(item[titleField] ?? `#${id}`)}</p>
                      {badgeField && item[badgeField] ? (
                        <Badge variant="secondary" className="text-[11px]">
                          {String(item[badgeField])}
                        </Badge>
                      ) : null}
                    </div>
                    {subtitleField && (
                      <p className="truncate text-xs text-zinc-500">{String(item[subtitleField] ?? '')}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {canReorder && (
                    <>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => reorderMutation.mutate({ id, direction: 'up' })}
                        aria-label="Monter"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => reorderMutation.mutate({ id, direction: 'down' })}
                        aria-label="Descendre"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => openEdit(item)}
                    aria-label="Modifier"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    onClick={() => {
                      if (window.confirm('Confirmer la suppression définitive ?')) {
                        deleteMutation.mutate(id);
                      }
                    }}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? `Modifier — ${title}` : `Ajouter — ${title}`}
      >
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          {fields.map((f) => {
            if (f.type === 'file') {
              return (
                <div key={f.name} className="space-y-1.5 md:col-span-2">
                  <Label>{f.label}</Label>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-dashed border-zinc-300 px-4 py-3 text-xs text-zinc-500 transition hover:border-red-500 hover:bg-red-500/5 dark:border-zinc-700">
                    <Upload className="h-4 w-4 text-red-600" />
                    <span className="truncate font-medium">
                      {files[f.name]?.name || 'Cliquer pour choisir un fichier…'}
                    </span>
                    <input
                      type="file"
                      accept={f.accept}
                      className="hidden"
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0];
                        if (selectedFile && selectedFile.size > 4 * 1024 * 1024) {
                          alert(`Le fichier "${selectedFile.name}" dépasse 4 Mo (${(selectedFile.size / (1024 * 1024)).toFixed(1)} Mo). Veuillez choisir une image de moins de 4 Mo pour respecter la limite du serveur.`);
                          e.target.value = '';
                          return;
                        }
                        setFiles({ ...files, [f.name]: selectedFile ?? null });
                      }}
                    />
                  </label>
                </div>
              );
            }
            if (f.type === 'select') {
              return (
                <div key={f.name} className="space-y-1.5">
                  <Label htmlFor={`field-${f.name}`}>{f.label}</Label>
                  <select
                    id={`field-${f.name}`}
                    required={f.required}
                    value={form[f.name] || f.defaultValue || f.options?.[0] || ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    {(f.options ?? []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }
            if (f.type === 'textarea') {
              return (
                <div key={f.name} className="space-y-1.5 md:col-span-2">
                  <Label htmlFor={`field-${f.name}`}>{f.label}</Label>
                  <Textarea
                    id={`field-${f.name}`}
                    rows={4}
                    required={f.required && !editingId}
                    placeholder={f.label}
                    value={form[f.name] || ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              );
            }
            return (
              <div key={f.name} className="space-y-1.5">
                <Label htmlFor={`field-${f.name}`}>{f.label}</Label>
                <Input
                  id={`field-${f.name}`}
                  type={f.type || 'text'}
                  required={f.required && !(editingId && f.type === 'password')}
                  placeholder={editingId && f.type === 'password' ? 'Laisser vide pour conserver' : f.label}
                  value={form[f.name] || ''}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>
            );
          })}

          <Separator className="md:col-span-2" />

          <div className="flex justify-end gap-2 md:col-span-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
