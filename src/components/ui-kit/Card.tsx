import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function GlassCard({ className, children, hover = false }: { className?: string; children: ReactNode; hover?: boolean }) {
  return <div className={cn('glass rounded-2xl p-5', hover && 'card-hover', className)}>{children}</div>;
}

export function Badge({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'info' | 'danger' | 'primary';
  className?: string;
}) {
  const tones: Record<string, string> = {
    default: 'bg-white/8 text-muted-foreground',
    success: 'bg-emerald-400/15 text-emerald-300',
    warning: 'bg-amber-400/15 text-amber-300',
    info: 'bg-sky-400/15 text-sky-300',
    danger: 'bg-rose-400/15 text-rose-300',
    primary: 'bg-primary/20 text-primary',
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border border-white/5',
      tones[tone],
      className,
    )}>
      {children}
    </span>
  );
}
