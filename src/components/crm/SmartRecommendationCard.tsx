import { Sparkles, Star, TrendingUp, X } from 'lucide-react';
import { Badge } from '@/components/ui-kit/Card';
import { useCrmRecommendations } from '@/contexts/CrmRecommendationsContext';
import {
  ACTION_LABELS,
  type RecommendationActionType,
} from '@/lib/crmEngine';
import { cn } from '@/lib/utils';

interface SmartRecommendationCardProps {
  leadId?: string;
  leadName?: string;
  compact?: boolean;
  className?: string;
}

const QUICK_ACTIONS: RecommendationActionType[] = [
  'schedule_demo',
  'create_lead',
  'send_follow_up',
  'assign_agent',
  'start_ai_call',
  'send_to_crm',
];

export function SmartRecommendationCard({
  leadId,
  leadName,
  compact = false,
  className,
}: SmartRecommendationCardProps) {
  const {
    getRecommendationForLead,
    recommendations,
    executeAction,
    rejectRecommendation,
  } = useCrmRecommendations();

  const recommendation =
    (leadId ? getRecommendationForLead(leadId) : null) ??
    (leadName ? recommendations.find((r) => r.leadName === leadName) : null) ??
    recommendations.find((r) => r.status === 'pending');

  if (!recommendation) {
    return (
      <div className={cn('glass rounded-xl p-4 text-sm text-muted-foreground', className)}>
        Analyzing lead data for recommendations…
      </div>
    );
  }

  const isDone = recommendation.status === 'completed' || recommendation.status === 'accepted';

  return (
    <div
      className={cn(
        'rounded-xl border border-primary/20 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/5 overflow-hidden',
        className,
      )}
    >
      <div className={cn('p-4', compact && 'p-3')}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg grad-primary grid place-items-center shrink-0">
              <Star className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-accent font-medium">
                Smart CRM Recommendations
              </p>
              <p className="text-[10px] text-muted-foreground">AI Recommendation</p>
            </div>
          </div>
          {!isDone && (
            <button
              type="button"
              onClick={() => rejectRecommendation(recommendation.id)}
              className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-muted-foreground">Next Best Action</span>
        </div>
        <h4 className={cn('font-bold text-foreground', compact ? 'text-sm' : 'text-base')}>
          {recommendation.title}
        </h4>

        <div className="mt-3 space-y-2 text-xs">
          <div>
            <span className="text-muted-foreground">Reason:</span>
            <p className="text-foreground/90 mt-0.5 leading-relaxed">{recommendation.reason}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="glass rounded-lg px-2.5 py-2">
              <div className="text-[10px] text-muted-foreground">Confidence</div>
              <div className="font-bold text-primary tabular-nums">{recommendation.confidence}%</div>
            </div>
            <div className="glass rounded-lg px-2.5 py-2">
              <div className="text-[10px] text-muted-foreground">Expected Conversion</div>
              <div className="font-bold text-emerald-400 tabular-nums flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {recommendation.expectedConversion}%
              </div>
            </div>
          </div>
        </div>

        {isDone ? (
          <Badge tone="success" className="mt-3">
            Action completed
          </Badge>
        ) : (
          <div className={cn('mt-3 grid gap-1.5', compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3')}>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => executeAction(recommendation.id, action)}
                className={cn(
                  'h-8 px-2 rounded-lg text-[10px] font-medium transition active:scale-[0.98]',
                  action === recommendation.actionType
                    ? 'grad-primary text-white'
                    : 'glass hover:bg-white/10 text-foreground/80',
                )}
              >
                {ACTION_LABELS[action]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
