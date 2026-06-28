export type AiMode = 'online' | 'away' | 'maintenance';
export type AiHealth = 'excellent' | 'good' | 'warning' | 'offline';

export interface AiMetrics {
  activeChats: number;
  repliesToday: number;
  leadsGenerated: number;
  voiceCallsHandled: number;
  latencyMs: number;
}

export interface AiStatusPersisted {
  mode: AiMode;
  paused: boolean;
  lastActivity: number;
}

export const AI_STATUS_STORAGE_KEY = 'omniflow_ai_status';

export const MODE_CONFIG: Record<
  AiMode,
  { label: string; description: string; emoji: string; badgeClass: string; dotClass: string }
> = {
  online: {
    label: 'Online',
    description: 'AI responding automatically',
    emoji: '🟢',
    badgeClass: 'border-emerald-500/30 bg-emerald-500/10',
    dotClass: 'bg-emerald-400',
  },
  away: {
    label: 'Away',
    description: 'AI suggestions only',
    emoji: '🟡',
    badgeClass: 'border-amber-500/30 bg-amber-500/10',
    dotClass: 'bg-amber-400',
  },
  maintenance: {
    label: 'Maintenance',
    description: 'AI disabled',
    emoji: '🔴',
    badgeClass: 'border-rose-500/30 bg-rose-500/10',
    dotClass: 'bg-rose-400',
  },
};

export const HEALTH_CONFIG: Record<AiHealth, { label: string; className: string }> = {
  excellent: { label: 'Excellent', className: 'text-emerald-300 bg-emerald-500/15' },
  good: { label: 'Good', className: 'text-sky-300 bg-sky-500/15' },
  warning: { label: 'Warning', className: 'text-amber-300 bg-amber-500/15' },
  offline: { label: 'Offline', className: 'text-rose-300 bg-rose-500/15' },
};

export function loadAiStatus(): AiStatusPersisted {
  if (typeof window === 'undefined') {
    return { mode: 'online', paused: false, lastActivity: Date.now() };
  }
  try {
    const raw = localStorage.getItem(AI_STATUS_STORAGE_KEY);
    if (!raw) return { mode: 'online', paused: false, lastActivity: Date.now() };
    const parsed = JSON.parse(raw) as AiStatusPersisted;
    if (!['online', 'away', 'maintenance'].includes(parsed.mode)) {
      return { mode: 'online', paused: false, lastActivity: Date.now() };
    }
    return {
      mode: parsed.mode,
      paused: Boolean(parsed.paused),
      lastActivity: parsed.lastActivity ?? Date.now(),
    };
  } catch {
    return { mode: 'online', paused: false, lastActivity: Date.now() };
  }
}

export function saveAiStatus(state: AiStatusPersisted): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AI_STATUS_STORAGE_KEY, JSON.stringify(state));
}

export function computeHealth(mode: AiMode, paused: boolean, latencyMs: number): AiHealth {
  if (mode === 'maintenance' || paused) return 'offline';
  if (mode === 'away') return 'warning';
  if (latencyMs < 180) return 'excellent';
  if (latencyMs < 450) return 'good';
  return 'warning';
}

export function formatLastActivity(timestamp: number): string {
  const elapsed = Date.now() - timestamp;
  if (elapsed < 60_000) return 'Just now';
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m ago`;
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h ago`;
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function isAiResponding(mode: AiMode, paused: boolean): boolean {
  return mode === 'online' && !paused;
}
