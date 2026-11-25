import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Moon, Sun, Shield, User as UserIcon, LogOut, Menu, X, Crown, ChevronDown, Mail, MapPin } from 'lucide-react';
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [userMenuOpen]);

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
            {user ? (
              <div className="relative hidden sm:block" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-2xl border border-zinc-200/80 bg-white px-3 py-1.5 text-xs font-semibold shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-600/10 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                    <UserIcon className="h-3.5 w-3.5" />
                  </div>
                  <span className="max-w-[120px] truncate">{user.username}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/95"
                    >
                      <div className="border-b border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
                        <p className="truncate text-xs font-bold text-zinc-900 dark:text-zinc-100">{user.username}</p>
                        <p className="truncate text-[11px] text-zinc-500">{user.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          <UserIcon className="h-4 w-4 text-zinc-500" />
                          Mon Profil
                        </Link>

                        {(user.is_president || user.requested_role === 'president' || user.role === 'admin') && (
                          <Link
                            to="/president/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/10"
                          >
                            <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            Espace Club
                          </Link>
                        )}

                        {user.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                          >
                            <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
                            Dashboard Admin
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-zinc-100 py-1 dark:border-zinc-800">
                        <button
                          type="button"
                          onClick={() => toggleTheme()}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          <span className="flex items-center gap-2.5">
                            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-zinc-500" />}
                            {theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}
                          </span>
                          <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                            {theme}
                          </span>
                        </button>
                      </div>

                      <div className="border-t border-zinc-100 pt-1 dark:border-zinc-800">
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            void logout();
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                        >
                          <LogOut className="h-4 w-4" />
                          Déconnexion
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Changer le thème"
                  className="rounded-xl p-2 text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <Link
                  to="/login"
                  className="hidden rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 sm:inline-block"
                >
                  Connexion
                </Link>
              </div>
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
                <div className="mt-2 flex flex-col gap-1 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                  {user ? (
                    <>
                      <div className="px-2 py-1.5">
                        <p className="truncate text-xs font-bold text-zinc-900 dark:text-zinc-100">{user.username}</p>
                        <p className="truncate text-[11px] text-zinc-500">{user.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <UserIcon className="h-4 w-4 text-zinc-500" /> Mon Profil
                      </Link>
                      {(user.is_president || user.requested_role === 'president' || user.role === 'admin') && (
                        <Link
                          to="/president/dashboard"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
                        >
                          <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Espace Club
                        </Link>
                      )}
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          <Shield className="h-4 w-4 text-red-600 dark:text-red-400" /> Dashboard Admin
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleTheme()}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <span className="flex items-center gap-2">
                          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-zinc-500" />}
                          {theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}
                        </span>
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{theme}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMobileOpen(false); void logout(); }}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                      >
                        <LogOut className="h-4 w-4" /> Déconnexion
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setMobileOpen(false)} className="w-full rounded-xl bg-red-600 py-2.5 text-center text-sm font-semibold text-white">
                        Connexion
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleTheme()}
                        className="mt-1 flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <span className="flex items-center gap-2">
                          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-zinc-500" />}
                          {theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}
                        </span>
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{theme}</span>
                      </button>
                    </>
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
