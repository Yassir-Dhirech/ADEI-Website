import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Shield, KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export function ProfilePage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const rules = {
    minLength: newPassword.length >= 8,
    match: newPassword.length > 0 && newPassword === confirmPassword,
    different: newPassword.length > 0 && newPassword !== currentPassword
  };
  const canSubmit = rules.minLength && rules.match && rules.different && currentPassword.length > 0;

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await apiRequest('/users/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      toast.success(res.message || 'Mot de passe modifié avec succès !');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du changement');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const badges = [
    user.role === 'admin' && 'Administrateur',
    user.is_president && 'Président',
    user.is_bureau_adei && 'Bureau ADEI',
    user.is_membre_adei && 'Membre ADEI',
    user.is_representant && 'Représentant'
  ].filter(Boolean) as string[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-12"
    >
      {/* Left Account Identity Card */}
      <div className="space-y-5 rounded-3xl border border-zinc-200/80 bg-white p-7 shadow-sm lg:col-span-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-red-500/30">
            <AvatarFallback className="bg-red-600 text-lg font-extrabold text-white">
              {user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-extrabold">{user.username}</h1>
            <p className="text-sm text-zinc-500">{user.email}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2.5">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <Shield className="h-3.5 w-3.5 text-red-600" /> Rôle &amp; Badges
          </p>
          <div className="flex flex-wrap gap-2">
            {badges.length > 0 ? (
              badges.map((b) => (
                <Badge key={b} className={b === 'Administrateur' ? 'bg-red-600 text-white' : ''} variant={b === 'Administrateur' ? 'default' : 'secondary'}>
                  {b}
                </Badge>
              ))
            ) : (
              <Badge variant="secondary">Étudiant</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Right Security Card */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-7 shadow-sm lg:col-span-7 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-red-500/10 p-2 text-red-600">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Sécurité du mot de passe</h2>
              <p className="text-xs text-zinc-500">Minimum 8 caractères requis</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPwd ? 'Masquer' : 'Afficher'}
          </button>
        </div>

        <form onSubmit={(e) => void handlePasswordChange(e)} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cur-pwd">Mot de passe actuel</Label>
            <Input
              id="cur-pwd"
              type={showPwd ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-pwd">Nouveau mot de passe</Label>
            <Input
              id="new-pwd"
              type={showPwd ? 'text' : 'password'}
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cnf-pwd">Confirmer le nouveau mot de passe</Label>
            <Input
              id="cnf-pwd"
              type={showPwd ? 'text' : 'password'}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>

          {/* Live Validation Checklist */}
          <div className="grid gap-1.5 rounded-2xl bg-zinc-50 p-3.5 text-xs dark:bg-zinc-950">
            {[
              { ok: rules.minLength, label: 'Au moins 8 caractères' },
              { ok: rules.match, label: 'Confirmation identique' },
              { ok: rules.different, label: 'Différent du mot de passe actuel' }
            ].map((r) => (
              <div key={r.label} className={`flex items-center gap-2 ${r.ok ? 'text-emerald-600' : 'text-zinc-500'}`}>
                {r.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                <span>{r.label}</span>
              </div>
            ))}
          </div>

          <Button
            type="submit"
            disabled={!canSubmit || loading}
            className="h-10 rounded-xl bg-red-600 px-5 text-white hover:bg-red-700"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Mise à jour…</> : 'Mettre à jour le mot de passe'}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
