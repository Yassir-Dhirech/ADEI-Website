import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Bon retour, ${user.username} !`);
      navigate(user.role === 'admin' ? '/admin' : '/profile');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Identifiants invalides';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-11rem)] max-w-5xl items-center justify-center py-4">
      {/* Ambient glowing orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-12 top-8 h-64 w-64 rounded-full bg-red-600/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 bottom-8 h-64 w-64 rounded-full bg-rose-500/15 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative grid w-full overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-2xl md:grid-cols-12 dark:border-zinc-800/80 dark:bg-zinc-900/95"
      >
        {/* Left Cinematic Visual Panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-white md:col-span-6 md:flex">
          <img
            src="/images/hero-login.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/90 via-zinc-950/80 to-black/95" />

          {/* Floating animated grid pattern */}
          <motion.div
            aria-hidden="true"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-red-600/30 blur-3xl"
          />

          <div className="relative z-10 flex items-center gap-3">
            <img
              src="/images/ADEI.png"
              alt="ADEI ENSA Fès"
              className="h-11 w-11 rounded-2xl border border-white/15 bg-white/10 p-1.5 object-contain backdrop-blur"
            />
            <div>
              <p className="text-sm font-bold tracking-wide text-white">ADEI ENSA FÈS</p>
              <p className="text-xs text-red-200/80">Portail Étudiant &amp; Administration</p>
            </div>
          </div>

          <div className="relative z-10 my-10 space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-200">
              <Sparkles className="h-3.5 w-3.5" /> Espace Sécurisé · Cookie HttpOnly
            </span>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight">
              Fédérer, innover et faire rayonner l&apos;ENSA Fès.
            </h2>
            <p className="text-sm leading-relaxed text-zinc-300">
              Accédez à votre espace membre, vos badges étudiants, la gestion des clubs, des actualités et des événements du campus.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <div>
              <p className="text-lg font-extrabold text-red-400">11+</p>
              <p className="text-[11px] text-zinc-300">Filières &amp; CP</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-red-400">17+</p>
              <p className="text-[11px] text-zinc-300">Clubs Actifs</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-red-400">100%</p>
              <p className="text-[11px] text-zinc-300">Communauté</p>
            </div>
          </div>
        </div>

        {/* Right Form Panel (shadcn/ui) */}
        <div className="flex flex-col justify-center p-8 sm:p-10 md:col-span-6">
          <div className="mb-6 flex items-center gap-3 md:hidden">
            <img src="/images/ADEI.png" alt="ADEI" className="h-9 w-9 rounded-xl object-contain" />
            <span className="font-extrabold text-red-600">ADEI ENSA Fès</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Connexion</h1>
            <p className="text-sm text-zinc-500">
              Entrez vos identifiants pour accéder à votre espace personnel.
            </p>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="mt-7 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login-email">Adresse email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nom@adei-ensaf.ma"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Mot de passe</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-end">
  <a
    href="https://wa.me/212629549292?text=Bonjour%20ADEI,%20j'ai%20oublié%20mon%20mot%20de%20passe%20sur%20le%20site"
    target="_blank"
    rel="noopener noreferrer"
    className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
  >
    Mot de passe oublié ? Contacter l'ADEI
  </a>
</div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-medium text-red-600 dark:text-red-400"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl bg-red-600 text-sm font-semibold text-white shadow-lg shadow-red-600/20 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Connexion en cours…
                </>
              ) : (
                <>
                  Se connecter <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <Separator className="my-6" />

          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Session protégée par cookie sécurisé
            </span>
            <Link to="/" className="font-semibold text-red-600 hover:underline">
              ← Retour accueil
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
