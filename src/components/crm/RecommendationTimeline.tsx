import { CheckCircle, Circle, Sparkles, Target, UserPlus } from 'lucide-react';
import { useCrmRecommendations } from '@/contexts/CrmRecommendationsContext';
import type { TimelineEventType } from '@/lib/crmEngine';

const ICONS: Record<TimelineEventType, typeof Circle> = {
  lead_created: UserPlus,
  score_generated: Target,
  sentiment_analyzed: Sparkles,
  recommendation_generated: Sparkles,
  action_completed: CheckCircle,
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function RecommendationTimeline({ leadId }: { leadId: string }) {
  const { getTimelineForLead } = useCrmRecommendations();
  const events = getTimelineForLead(leadId);

  if (events.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
        Recommendation Timeline
      </div>
      <div className="space-y-0">
        {events.map((event, index) => {
          const Icon = ICONS[event.type];
          const isLast = index === events.length - 1;
          return (
            <div key={event.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full grid place-items-center shrink-0 ${
                    event.type === 'action_completed'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-white/10 text-accent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {!isLast && <div className="w-px flex-1 bg-white/10 min-h-[20px] my-1" />}
              </div>
              <div className="pb-4 min-w-0">
                <p className="text-sm font-medium">{event.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{formatTime(event.timestamp)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
