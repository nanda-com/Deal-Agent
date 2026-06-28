import { Sparkles } from 'lucide-react';
import { GlassCard, Badge } from '@/components/ui-kit/Card';
import { useCrmRecommendations } from '@/contexts/CrmRecommendationsContext';

export function TopRecommendationsWidget() {
  const { topToday, executeAction } = useCrmRecommendations();

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h3 className="font-semibold">Top AI Recommendations Today</h3>
        </div>
        <Badge tone="primary">{topToday.length} active</Badge>
      </div>

      {topToday.length === 0 ? (
        <p className="text-sm text-muted-foreground">All recommendations actioned — great work!</p>
      ) : (
        <div className="space-y-2">
          {topToday.map((rec) => (
            <button
              key={rec.id}
              type="button"
              onClick={() => executeAction(rec.id, rec.actionType)}
              className="w-full text-left glass rounded-xl p-3 hover:bg-white/8 transition active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{rec.leadName}</div>
                  <div className="text-xs text-accent truncate">{rec.title}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-primary tabular-nums">{rec.confidence}%</div>
                  <div className="text-[10px] text-muted-foreground">confidence</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[11px]">
                <span className="text-muted-foreground">Expected revenue</span>
                <span className="font-semibold text-emerald-400 tabular-nums">
                  ${rec.expectedRevenue.toLocaleString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

export function CrmAnalyticsWidget() {
  const { analytics } = useCrmRecommendations();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { label: 'Generated', value: analytics.generated },
        { label: 'Accepted', value: analytics.accepted },
        { label: 'Rejected', value: analytics.rejected },
        { label: 'Conversion Rate', value: `${analytics.conversionRate}%` },
      ].map((item) => (
        <GlassCard key={item.label}>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</div>
          <div className="text-xl font-bold mt-1 tabular-nums">{item.value}</div>
        </GlassCard>
      ))}
    </div>
  );
}
