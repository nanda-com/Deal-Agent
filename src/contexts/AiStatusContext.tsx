import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { useAnalytics } from '@/hooks/useDashboard';
import {
  computeHealth,
  formatLastActivity,
  isAiResponding,
  loadAiStatus,
  saveAiStatus,
  type AiHealth,
  type AiMetrics,
  type AiMode,
} from '@/lib/aiStatus';

interface AiStatusContextValue {
  mode: AiMode;
  paused: boolean;
  health: AiHealth;
  metrics: AiMetrics;
  lastActivity: number;
  lastActivityLabel: string;
  isResponding: boolean;
  activeAiConversations: number;
  setMode: (mode: AiMode) => void;
  pauseAi: () => void;
  resumeAi: () => void;
  touchActivity: () => void;
}

const DEFAULT_METRICS: AiMetrics = {
  activeChats: 23,
  repliesToday: 412,
  leadsGenerated: 18,
  voiceCallsHandled: 7,
  latencyMs: 142,
};

const AiStatusContext = createContext<AiStatusContextValue | null>(null);

export function AiStatusProvider({ children }: { children: ReactNode }) {
  const persisted = loadAiStatus();
  const [mode, setModeState] = useState<AiMode>(persisted.mode);
  const [paused, setPaused] = useState(persisted.paused);
  const [lastActivity, setLastActivity] = useState(persisted.lastActivity);
  const [latencyMs, setLatencyMs] = useState(DEFAULT_METRICS.latencyMs);
  const { data: analytics } = useAnalytics();

  const metrics = useMemo<AiMetrics>(() => {
    const activeChats = analytics?.activeChannels?.length
      ? Math.max(8, Math.floor((analytics.totalConversations ?? 0) / 120))
      : DEFAULT_METRICS.activeChats;

    return {
      activeChats,
      repliesToday: analytics?.aiHandledCount ?? DEFAULT_METRICS.repliesToday,
      leadsGenerated: analytics?.totalLeads ?? DEFAULT_METRICS.leadsGenerated,
      voiceCallsHandled: Math.max(3, Math.floor((analytics?.aiHandledCount ?? 0) / 58)),
      latencyMs,
    };
  }, [analytics, latencyMs]);

  const activeAiConversations = useMemo(
    () => Math.max(1, Math.floor(metrics.activeChats * 0.85)),
    [metrics.activeChats],
  );

  const health = useMemo(
    () => computeHealth(mode, paused, metrics.latencyMs),
    [mode, paused, metrics.latencyMs],
  );

  const persist = useCallback((nextMode: AiMode, nextPaused: boolean, activity: number) => {
    saveAiStatus({ mode: nextMode, paused: nextPaused, lastActivity: activity });
  }, []);

  const touchActivity = useCallback(() => {
    const now = Date.now();
    setLastActivity(now);
    persist(mode, paused, now);
  }, [mode, paused, persist]);

  const setMode = useCallback(
    (next: AiMode) => {
      setModeState(next);
      const now = Date.now();
      setLastActivity(now);
      persist(next, paused, now);

      if (next === 'away') {
        toast('AI Mode changed to Away', {
          description: MODE_TOAST_DESCRIPTION.away,
        });
      } else if (next === 'maintenance') {
        toast('AI Mode changed to Maintenance', {
          description: MODE_TOAST_DESCRIPTION.maintenance,
        });
      } else {
        toast.success('AI Mode changed to Online', {
          description: MODE_TOAST_DESCRIPTION.online,
        });
      }
    },
    [paused, persist],
  );

  const pauseAi = useCallback(() => {
    setPaused(true);
    const now = Date.now();
    setLastActivity(now);
    persist(mode, true, now);
    toast('AI Assistant Paused', { description: 'Automatic replies are suspended until resumed.' });
  }, [mode, persist]);

  const resumeAi = useCallback(() => {
    setPaused(false);
    const now = Date.now();
    setLastActivity(now);
    persist(mode, false, now);
    toast.success('AI Assistant Resumed', {
      description: isAiResponding(mode, false)
        ? 'Automatic responses are active again.'
        : 'Resume complete — change mode to Online for auto-replies.',
    });
  }, [mode, persist]);

  useEffect(() => {
    persist(mode, paused, lastActivity);
  }, [mode, paused, lastActivity, persist]);

  useEffect(() => {
    if (mode === 'maintenance' || paused) return;
    const interval = window.setInterval(() => {
      setLatencyMs((prev) => {
        const jitter = Math.floor(Math.random() * 40) - 20;
        const base = mode === 'away' ? 320 : 140;
        return Math.max(80, Math.min(600, base + jitter + (prev % 17)));
      });
      if (Math.random() > 0.7) {
        setLastActivity(Date.now());
      }
    }, 8000);
    return () => window.clearInterval(interval);
  }, [mode, paused]);

  const value = useMemo<AiStatusContextValue>(
    () => ({
      mode,
      paused,
      health,
      metrics,
      lastActivity,
      lastActivityLabel: formatLastActivity(lastActivity),
      isResponding: isAiResponding(mode, paused),
      activeAiConversations,
      setMode,
      pauseAi,
      resumeAi,
      touchActivity,
    }),
    [
      mode,
      paused,
      health,
      metrics,
      lastActivity,
      activeAiConversations,
      setMode,
      pauseAi,
      resumeAi,
      touchActivity,
    ],
  );

  return <AiStatusContext.Provider value={value}>{children}</AiStatusContext.Provider>;
}

const MODE_TOAST_DESCRIPTION = {
  online: 'AI responding automatically',
  away: 'AI suggestions only',
  maintenance: 'AI disabled',
};

export function useAiStatus() {
  const ctx = useContext(AiStatusContext);
  if (!ctx) {
    throw new Error('useAiStatus must be used within AiStatusProvider');
  }
  return ctx;
}
