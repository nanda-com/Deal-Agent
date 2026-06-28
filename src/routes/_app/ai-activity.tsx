import { ScrollText, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui-kit/Card';
import { useAiStatus } from '@/contexts/AiStatusContext';
import { HEALTH_CONFIG, MODE_CONFIG } from '@/lib/aiStatus';

const FULL_LOG = [
  { time: '2m ago', type: 'Reply', channel: 'WhatsApp', detail: 'Answered pricing question for lead #1842' },
  { time: '5m ago', type: 'Score', channel: 'LinkedIn', detail: 'Lead score updated: Camila Rossi → 92' },
  { time: '8m ago', type: 'Suggestion', channel: 'Instagram', detail: 'Generated 3 reply suggestions' },
  { time: '14m ago', type: 'Voice', channel: 'Phone', detail: 'Call summary — Priya Sharma, demo booked' },
  { time: '22m ago', type: 'Reply', channel: 'Web Chat', detail: 'Auto-qualified inbound visitor' },
  { time: '31m ago', type: 'Reply', channel: 'Facebook', detail: 'After-hours response sent' },
  { time: '45m ago', type: 'Automation', channel: 'All', detail: 'Welcome flow triggered for new lead' },
  { time: '1h ago', type: 'Reply', channel: 'WhatsApp', detail: 'Scheduled demo via Calendly link' },
];

export function AiActivityPage() {
  const { mode, paused, health, metrics, lastActivityLabel } = useAiStatus();
  const modeConfig = MODE_CONFIG[mode];
  const healthConfig = HEALTH_CONFIG[health];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-accent uppercase tracking-widest">
          <ScrollText className="w-3.5 h-3.5" />
          AI Activity
        </div>
        <h1 className="text-3xl font-bold mt-1">AI Activity Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Full audit trail of AI actions across all channels
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard>
          <div className="text-xs text-muted-foreground">Mode</div>
          <div className="text-lg font-semibold mt-1">
            {modeConfig.emoji} {paused ? 'Paused' : modeConfig.label}
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-xs text-muted-foreground">Health</div>
          <div className={`text-lg font-semibold mt-1 inline-flex px-2 py-0.5 rounded-full text-sm ${healthConfig.className}`}>
            {healthConfig.label}
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-xs text-muted-foreground">Replies today</div>
          <div className="text-lg font-semibold mt-1 tabular-nums">{metrics.repliesToday}</div>
        </GlassCard>
        <GlassCard>
          <div className="text-xs text-muted-foreground">Last activity</div>
          <div className="text-lg font-semibold mt-1">{lastActivityLabel}</div>
        </GlassCard>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h3 className="font-semibold">Recent events</h3>
        </div>
        <div className="divide-y divide-white/5">
          {FULL_LOG.map((entry) => (
            <div key={entry.time + entry.detail} className="px-5 py-3.5 flex gap-4 text-sm hover:bg-white/3 transition">
              <span className="text-xs text-muted-foreground w-14 shrink-0 tabular-nums">{entry.time}</span>
              <span className="text-xs font-medium text-accent w-20 shrink-0">{entry.type}</span>
              <span className="text-xs text-muted-foreground w-20 shrink-0">{entry.channel}</span>
              <span className="text-foreground/90 flex-1">{entry.detail}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
