import { useEffect, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all dark:border-zinc-800/80 dark:bg-zinc-900/90',
        className
      )}
      {...props}
    />
  );
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}) {
  const variants = {
    primary: 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[0.99]',
    outline: 'border border-zinc-300 bg-transparent hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800',
    ghost: 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
    danger: 'bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400'
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = 'red',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: 'red' | 'zinc' | 'green' | 'amber' }) {
  const tones = {
    red: 'bg-red-500/10 text-red-600 ring-1 ring-red-500/20 dark:text-red-400',
    zinc: 'bg-zinc-500/10 text-zinc-600 ring-1 ring-zinc-500/20 dark:text-zinc-300',
    green: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400'
  };
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone], className)}
      {...props}
    />
  );
}

export function PageHero({
  title,
  subtitle,
  image,
  badge,
  actions
}: {
  title: string;
  subtitle: string;
  image: string;
  badge?: string;
  actions?: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-3xl border border-zinc-200/60 bg-zinc-950 px-6 py-14 text-white shadow-xl sm:px-12 sm:py-18 dark:border-zinc-800"
    >
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-luminosity"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/90 via-zinc-950/85 to-zinc-950/95" />
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {badge && (
          <span className="mb-4 inline-flex items-center rounded-full border border-red-400/30 bg-red-500/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-red-200">
            {badge}
          </span>
        )}
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">{subtitle}</p>
        {actions && <div className="mt-7 flex flex-wrap items-center justify-center gap-3">{actions}</div>}
      </div>
    </motion.section>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-zinc-200 pb-3 dark:border-zinc-800">
              <h2 className="text-xl font-bold">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CardSkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-64 animate-pulse rounded-2xl border border-zinc-200/70 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
        />
      ))}
    </div>
  );
}
