import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Moon, Sun, Shield, User as UserIcon, LogOut, Menu, X, Mail, MapPin, Crown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  { to: '/', label: 'Accueil' },
  { to: '/news', label: 'Actus & Événements' },
  { to: '/clubs', label: 'Clubs' },
  { to: '/ensa', label: 'ENSA Fès' },
  { to: '/adei', label: 'ADEI' },
  { to: '/feedbacks', label: 'Feedbacks' }
];

export function Layout() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/images/ADEI.png" alt="Logo ADEI" className="h-9 w-9 rounded-xl object-contain" />
            <div className="leading-tight">
              <span className="block text-base font-extrabold tracking-tight text-red-600">ADEI ENSA Fès</span>
              <span className="hidden text-[11px] text-zinc-500 sm:block">Association des Étudiants Ingénieurs</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  isActive
                    ? 'rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-semibold text-red-600 dark:text-red-400'
                    : 'rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/70 dark:hover:text-white'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Changer le thème"
              className="rounded-xl p-2 text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {user ? (
              <div className="hidden items-center gap-1.5 sm:flex">
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700"
                  >
                    <Shield className="h-3.5 w-3.5" /> Admin
                  </Link>
                )}
                {(user.is_president || user.requested_role === 'president' || user.role === 'admin') && (
                  <Link
                    to="/president/dashboard"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-500/20 dark:text-amber-400"
                  >
                    <Crown className="h-3.5 w-3.5" /> Espace Club
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
                >
                  <UserIcon className="h-3.5 w-3.5" /> {user.username}
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  aria-label="Déconnexion"
                  className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 sm:inline-block"
              >
                Connexion
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu mobile"
              className="rounded-xl p-2 hover:bg-zinc-100 md:hidden dark:hover:bg-zinc-800"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-zinc-200 bg-white px-4 pb-4 md:hidden dark:border-zinc-800 dark:bg-zinc-950"
            >
              <nav className="flex flex-col gap-1 pt-3">
                {navLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      isActive
                        ? 'rounded-xl bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-600'
                        : 'rounded-xl px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300'
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
                <div className="mt-2 flex flex-wrap gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                  {user ? (
                    <>
                      {user.role === 'admin' && (
                        <Link to="/admin" onClick={() => setMobileOpen(false)} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white">
                          Dashboard Admin
                        </Link>
                      )}
                      {(user.is_president || user.requested_role === 'president' || user.role === 'admin') && (
                        <Link
                          to="/president/dashboard"
                          onClick={() => setMobileOpen(false)}
                          className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400"
                        >
                          Espace Club
                        </Link>
                      )}
                      <Link to="/profile" onClick={() => setMobileOpen(false)} className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-medium dark:border-zinc-700">
                        Profil ({user.username})
                      </Link>
                      <button
                        type="button"
                        onClick={() => { setMobileOpen(false); void logout(); }}
                        className="rounded-xl bg-zinc-200 px-3 py-2 text-xs font-medium dark:bg-zinc-800"
                      >
                        Déconnexion
                      </button>
                    </>
                  ) : (
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="w-full rounded-xl bg-red-600 py-2 text-center text-sm font-semibold text-white">
                      Connexion
                    </Link>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <img src="/images/ADEI.png" alt="ADEI" className="h-8 w-8 rounded-lg object-contain" />
              <span className="font-extrabold text-red-600">ADEI ENSA Fès</span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-500">
              Association des Étudiants Ingénieurs de l&apos;École Nationale des Sciences Appliquées de Fès — fédérer, innover et accompagner les élèves ingénieurs.
            </p>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Navigation</h3>
            <ul className="grid grid-cols-2 gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
              {navLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-red-600">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Contact</h3>
            <p className="flex items-center gap-2 text-xs"><MapPin className="h-4 w-4 text-red-600" /> Quartier Industriel Ain Chkef, Route Ben Souda, Fès</p>
            <p className="flex items-center gap-2 text-xs"><Mail className="h-4 w-4 text-red-600" /> admin@adei-ensaf.ma</p>
          </div>
        </div>
        <div className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800">
          © {new Date().getFullYear()} ADEI ENSA Fès — Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
