import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  BarChart3,
  ScrollText,
  Pause,
  Play,
  MessagesSquare,
  Users,
  PhoneCall,
  Bot,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAiStatus } from '@/contexts/AiStatusContext';
import {
  HEALTH_CONFIG,
  MODE_CONFIG,
  type AiMode,
} from '@/lib/aiStatus';

const MODES: AiMode[] = ['online', 'away', 'maintenance'];

const ACTIVITY_LOG = [
  { time: '2m ago', text: 'Replied to WhatsApp lead — pricing inquiry' },
  { time: '8m ago', text: 'Scored new lead: Camila Rossi (92)' },
  { time: '14m ago', text: 'Voice call summary generated — Priya Sharma' },
  { time: '22m ago', text: 'Suggested 3 responses in Instagram thread' },
  { time: '31m ago', text: 'Auto-qualified lead from web chat' },
];

export function AiStatusControl() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const {
    mode,
    paused,
    health,
    metrics,
    lastActivityLabel,
    isResponding,
    activeAiConversations,
    setMode,
    pauseAi,
    resumeAi,
  } = useAiStatus();

  const config = MODE_CONFIG[mode];
  const healthConfig = HEALTH_CONFIG[health];
  const showPulse = mode === 'online' && !paused;
  const badgeClass = paused ? 'border-rose-500/30 bg-rose-500/10' : config.badgeClass;
  const dotClass = paused ? 'bg-rose-400' : config.dotClass;

  const badgeLabel =
    mode === 'online' && !paused
      ? `AI Online • ${metrics.activeChats} active conversations`
      : mode === 'away'
        ? `AI Away • ${metrics.activeChats} active`
        : paused
          ? 'AI Paused'
          : 'AI Offline';

  const closeAndNavigate = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer',
          'hover:brightness-110 active:scale-[0.98]',
          badgeClass,
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`AI status: ${config.label}`}
      >
        <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
        <span className="text-xs font-medium text-foreground/90 max-w-[200px] truncate">
          {badgeLabel}
        </span>
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotClass,
            showPulse && 'ai-status-pulse',
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', damping: 24 }}
              role="dialog"
              aria-label="AI control center"
              className="absolute right-0 top-full mt-2 w-[min(100vw-2rem,380px)] bg-[#0f172a] text-white rounded-2xl overflow-hidden shadow-2xl z-[41] border border-white/10"
            >
              <div className="p-4 border-b border-white/10 bg-gradient-to-br from-violet-500/10 to-cyan-500/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl grad-primary grid place-items-center">
                        <Bot className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">AI Control Center</h3>
                        <p className="text-[11px] text-slate-400">Nova · Gemini assistant</p>
                      </div>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full',
                      healthConfig.className,
                    )}
                  >
                    {healthConfig.label}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className={cn('w-2 h-2 rounded-full', config.dotClass, showPulse && 'ai-status-pulse')} />
                  <span className="font-medium">
                    {paused ? 'Paused' : config.label}
                    {!paused && mode !== 'maintenance' && (
                      <span className="text-slate-400 font-normal"> · {metrics.latencyMs}ms latency</span>
                    )}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {paused ? 'Automatic replies suspended' : `${config.emoji} ${config.description}`}
                </p>
              </div>

              <div className="p-4 space-y-4 max-h-[min(70vh,520px)] overflow-y-auto">
                <section>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">AI Mode</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {MODES.map((m) => {
                      const mc = MODE_CONFIG[m];
                      const active = mode === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMode(m)}
                          className={cn(
                            'rounded-xl px-2 py-2.5 text-center text-[11px] font-medium border transition-all',
                            active
                              ? 'border-primary/50 bg-primary/15 text-white'
                              : 'border-white/5 bg-white/5 text-slate-400 hover:bg-white/8 hover:text-slate-200',
                          )}
                        >
                          <span className="block text-base mb-0.5">{mc.emoji}</span>
                          {mc.label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="grid grid-cols-2 gap-2">
                  <StatCard
                    icon={MessagesSquare}
                    label="Active chats"
                    value={metrics.activeChats}
                  />
                  <StatCard
                    icon={Sparkles}
                    label="AI replies today"
                    value={metrics.repliesToday}
                  />
                  <StatCard icon={Users} label="Leads generated" value={metrics.leadsGenerated} />
                  <StatCard
                    icon={PhoneCall}
                    label="Voice calls"
                    value={metrics.voiceCallsHandled}
                  />
                </section>

                <section className="rounded-xl bg-white/5 border border-white/5 p-3 space-y-2 text-xs">
                  <Row label="Status" value={paused ? 'Paused' : isResponding ? 'Online' : 'Offline'} />
                  <Row label="Response latency" value={`${metrics.latencyMs} ms`} />
                  <Row label="Active AI conversations" value={String(activeAiConversations)} />
                  <Row label="AI replies today" value={metrics.repliesToday.toLocaleString()} />
                  <Row label="Last activity" value={lastActivityLabel} />
                </section>

                <section>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                    Recent activity
                  </p>
                  <div className="space-y-2">
                    {ACTIVITY_LOG.slice(0, 3).map((entry) => (
                      <div
                        key={entry.time}
                        className="text-[11px] flex gap-2 text-slate-400"
                      >
                        <span className="text-slate-500 shrink-0 tabular-nums">{entry.time}</span>
                        <span className="text-slate-300">{entry.text}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                    Quick actions
                  </p>
                  <div className="space-y-1">
                    <QuickAction
                      icon={BarChart3}
                      label="View AI Analytics"
                      onClick={() => closeAndNavigate('/analytics')}
                    />
                    <QuickAction
                      icon={ScrollText}
                      label="Open AI Activity Log"
                      onClick={() => closeAndNavigate('/ai-activity')}
                    />
                    {paused ? (
                      <QuickAction
                        icon={Play}
                        label="Resume AI"
                        onClick={() => {
                          resumeAi();
                          setOpen(false);
                        }}
                        accent
                      />
                    ) : (
                      <QuickAction
                        icon={Pause}
                        label="Pause AI"
                        onClick={() => {
                          pauseAi();
                          setOpen(false);
                        }}
                      />
                    )}
                  </div>
                </section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/5 p-2.5">
      <Icon className="w-3.5 h-3.5 text-accent mb-1" />
      <div className="text-lg font-bold tabular-nums">{value.toLocaleString()}</div>
      <div className="text-[10px] text-slate-500 leading-tight">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-200 font-medium tabular-nums text-right">{value}</span>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  accent,
}: {
  icon: typeof Activity;
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all',
        'hover:bg-white/8 active:scale-[0.99] cursor-pointer',
        accent ? 'text-emerald-300' : 'text-slate-200',
      )}
    >
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="flex-1 text-left">{label}</span>
      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
    </button>
  );
}
