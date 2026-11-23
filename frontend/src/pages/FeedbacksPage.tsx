import { useState, type FormEvent, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, Send, MessageSquareHeart, Lightbulb, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { FeedbackItem } from '@/types/api';
import { PageHero } from '@/components/ui';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

const FEEDBACK_TYPES = [
  { value: 'avis', label: 'Avis', icon: MessageSquareHeart },
  { value: 'recommandation', label: 'Idée', icon: Lightbulb },
  { value: 'autre', label: 'Autre', icon: Sparkles }
] as const;

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'ET';
}

export function FeedbacksPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.username ?? '',
    email: user?.email ?? '',
    type: 'avis',
    message: ''
  });

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.username,
        email: user.email
      }));
    }
  }, [user]);
  const [filter, setFilter] = useState<string>('all');
  const [likesMap, setLikesMap] = useState<Record<number, { liked: boolean; count: number }>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['feedbacks', 'public'],
    queryFn: () => apiRequest<FeedbackItem[]>('/feedbacks/public')
  });

  const submitMutation = useMutation({
    mutationFn: () => apiRequest('/feedbacks', { method: 'POST', body: JSON.stringify(form) }),
    onSuccess: (res) => {
      toast.success(res.message || 'Message envoyé ! Il apparaîtra après validation par le bureau ADEI.');
      setForm({ name: user?.username ?? '', email: user?.email ?? '', type: 'avis', message: '' });
    },
    onError: (err: Error) => toast.error(err.message || "Impossible d'envoyer le message.")
  });

  const likeMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ liked: boolean; likesCount: number }>(`/feedbacks/${id}/like`, { method: 'POST' }),
    onSuccess: (res, id) => {
      setLikesMap((prev) => ({ ...prev, [id]: { liked: res.data.liked, count: res.data.likesCount } }));
    },
    onError: (err: Error) => toast.error(err.message)
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  };

  const published = (data?.data ?? []).filter((fb) => filter === 'all' || fb.type === filter);

  return (
    <div className="space-y-8">
      <PageHero
        badge="Boîte à Idées"
        title="Vos Avis & Recommandations"
        subtitle="Partagez vos idées pour améliorer la vie étudiante à l'ENSA Fès. Chaque message est lu par l'ADEI et modéré avant publication."
        image="/images/hero-messages.png"
      />

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Sticky Submission Form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-5"
        >
          <div className="sticky top-24 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/90">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Laisser un message</h2>
                <p className="mt-0.5 text-xs text-zinc-500">Votre voix compte pour le campus.</p>
              </div>
              <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Modéré
              </Badge>
            </div>

            <Separator className="my-5" />

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Interactive type selector */}
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <div className="grid grid-cols-3 gap-2">
                  {FEEDBACK_TYPES.map((t) => {
                    const Icon = t.icon;
                    const active = form.type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setForm({ ...form, type: t.value })}
                        className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                          active
                            ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400'
                            : 'border-zinc-200 bg-transparent text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fb-name">Nom</Label>
                    {user && <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Compte vérifié</span>}
                  </div>
                  <Input
                    id="fb-name"
                    required
                    readOnly={Boolean(user)}
                    placeholder="Ex: Youssef A."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={`h-10 rounded-xl ${user ? 'cursor-not-allowed bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400' : ''}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fb-email">Email</Label>
                    {user && <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Verrouillé</span>}
                  </div>
                  <Input
                    id="fb-email"
                    required
                    type="email"
                    readOnly={Boolean(user)}
                    placeholder="prenom@usmba.ac.ma"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`h-10 rounded-xl ${user ? 'cursor-not-allowed bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400' : ''}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="fb-message">Message</Label>
                  <span className="text-[11px] text-zinc-400">{form.message.length} caractères</span>
                </div>
                <Textarea
                  id="fb-message"
                  required
                  rows={4}
                  placeholder="Partagez une suggestion d'événement, une amélioration sur le campus ou un avis constructif…"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="h-11 w-full rounded-xl bg-red-600 text-white hover:bg-red-700"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Envoyer à l&apos;ADEI
                  </>
                )}
              </Button>
            </form>
          </div>
        </motion.div>

        {/* Community Messages Wall */}
        <div className="space-y-5 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Mur de la Communauté</h2>
              <p className="text-xs text-zinc-500">
                {(data?.data ?? []).length} message{(data?.data ?? []).length > 1 ? 's' : ''} publié{(data?.data ?? []).length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['all', 'avis', 'recommandation', 'autre'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilter(type)}
                  className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                    filter === type
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  {type === 'all' ? 'Tous' : type}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-28 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
                />
              ))}
            </div>
          ) : published.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-white/60 py-14 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
              <MessageSquareHeart className="mx-auto mb-3 h-9 w-9 text-zinc-400" />
              <p className="text-sm font-semibold">Aucun message publié dans cette catégorie</p>
              <p className="mt-1 text-xs text-zinc-500">Soyez le premier à partager votre idée !</p>
            </div>
          ) : (
            <div className="space-y-4">
              {published.map((fb, idx) => {
                const likeState = likesMap[fb.id];
                return (
                  <motion.div
                    key={fb.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.2) }}
                    className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:border-red-500/40 dark:border-zinc-800/80 dark:bg-zinc-900/90"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-700">
                          <AvatarFallback className="bg-red-500/10 text-xs font-bold text-red-600 dark:text-red-400">
                            {getInitials(fb.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold">{fb.name}</span>
                            <Badge variant="secondary" className="capitalize">
                              {fb.type}
                            </Badge>
                          </div>
                          {fb.createdAt && (
                            <p className="text-[11px] text-zinc-400">
                              {new Date(fb.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!user) {
                            toast.info('Connectez-vous pour soutenir un message.');
                            return;
                          }
                          likeMutation.mutate(fb.id);
                        }}
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          likeState?.liked
                            ? 'border-red-500/40 bg-red-500/10 text-red-600'
                            : 'border-zinc-200 text-zinc-500 hover:border-red-400 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400'
                        }`}
                      >
                        <Heart className={`h-3.5 w-3.5 ${likeState?.liked ? 'fill-red-600 text-red-600' : ''}`} />
                        <span>{likeState ? likeState.count : 'Soutenir'}</span>
                      </button>
                    </div>

                    <p className="mt-3.5 whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {fb.message}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

