import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, EyeOff, Trash2, MessageSquareCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import type { FeedbackItem } from '@/types/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function FeedbacksAdminPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'pending' | 'published' | 'all'>('pending');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'feedbacks'],
    queryFn: () => apiRequest<FeedbackItem[]>('/feedbacks')
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'feedbacks'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'counts'] });
    void queryClient.invalidateQueries({ queryKey: ['feedbacks', 'public'] });
  };

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: number; isPublished: boolean }) =>
      apiRequest(`/feedbacks/${id}/publish`, { method: 'PUT', body: JSON.stringify({ isPublished }) }),
    onSuccess: (_res, vars) => {
      toast.success(vars.isPublished ? 'Feedback publié sur le mur public !' : 'Feedback masqué.');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/feedbacks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Feedback supprimé.');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message)
  });

  const all = data?.data ?? [];
  const pendingCount = all.filter((f) => !f.isPublished).length;
  const publishedCount = all.filter((f) => f.isPublished).length;

  const filtered = all.filter((f) => {
    if (tab === 'pending') return !f.isPublished;
    if (tab === 'published') return Boolean(f.isPublished);
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/90">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight">Modération des Feedbacks</h1>
            {pendingCount > 0 && (
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
                {pendingCount} en attente
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Validez les messages pertinents pour les rendre visibles dans la Boîte à Idées.
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(String(v) as 'pending' | 'published' | 'all')}>
          <TabsList>
            <TabsTrigger value="pending">En attente ({pendingCount})</TabsTrigger>
            <TabsTrigger value="published">Publiés ({publishedCount})</TabsTrigger>
            <TabsTrigger value="all">Tous ({all.length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-24 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white/60 py-14 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <MessageSquareCheck className="mb-3 h-9 w-9 text-zinc-400" />
          <p className="text-sm font-semibold">Aucun feedback dans cet onglet</p>
          <p className="mt-1 text-xs text-zinc-500">Tout est à jour !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((fb) => (
            <div
              key={fb.id}
              className="flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between dark:border-zinc-800/80 dark:bg-zinc-900/90"
            >
              <div className="flex items-start gap-3.5">
                <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-700">
                  <AvatarFallback className="bg-red-500/10 text-xs font-bold text-red-600 dark:text-red-400">
                    {fb.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{fb.name}</span>
                    <span className="text-xs text-zinc-400">{fb.email}</span>
                    <Badge variant="secondary" className="capitalize">
                      {fb.type}
                    </Badge>
                    {fb.isPublished ? (
                      <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Publié
                      </Badge>
                    ) : (
                      <Badge className="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-400">
                        <Clock className="h-3 w-3" /> En attente
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{fb.message}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant={fb.isPublished ? 'outline' : 'default'}
                  size="sm"
                  className={fb.isPublished ? '' : 'bg-emerald-600 text-white hover:bg-emerald-700'}
                  onClick={() => publishMutation.mutate({ id: fb.id, isPublished: !fb.isPublished })}
                >
                  {fb.isPublished ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" /> Masquer
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Publier
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="icon-sm"
                  onClick={() => {
                    if (window.confirm('Supprimer définitivement ce feedback ?')) {
                      deleteMutation.mutate(fb.id);
                    }
                  }}
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
