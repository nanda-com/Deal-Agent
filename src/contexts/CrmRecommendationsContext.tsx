import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLeadsContext } from '@/contexts/LeadsContext';
import { useAppointmentsContext } from '@/contexts/AppointmentsContext';
import {
  ACTION_LABELS,
  buildInitialTimeline,
  CRM_STORAGE_KEY,
  generateRecommendationForLead,
  type CrmRecommendation,
  type RecommendationActionType,
  type RecommendationAnalytics,
  type RecommendationTimelineEvent,
} from '@/lib/crmEngine';

interface PersistedCrmState {
  recommendations: CrmRecommendation[];
  timeline: RecommendationTimelineEvent[];
  stats: { accepted: number; rejected: number };
}

interface CrmRecommendationsContextValue {
  recommendations: CrmRecommendation[];
  timeline: RecommendationTimelineEvent[];
  analytics: RecommendationAnalytics;
  topToday: CrmRecommendation[];
  getRecommendationForLead: (leadId: string) => CrmRecommendation | null;
  getTimelineForLead: (leadId: string) => RecommendationTimelineEvent[];
  executeAction: (recommendationId: string, action?: RecommendationActionType) => void;
  rejectRecommendation: (recommendationId: string) => void;
  refreshRecommendations: () => void;
}

const CrmRecommendationsContext = createContext<CrmRecommendationsContextValue | null>(null);

function loadPersisted(): PersistedCrmState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CRM_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedCrmState) : null;
  } catch {
    return null;
  }
}

function savePersisted(state: PersistedCrmState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(state));
}

export function CrmRecommendationsProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { leads, updateLead, addLead } = useLeadsContext();
  const { addAppointment } = useAppointmentsContext();
  const [recommendations, setRecommendations] = useState<CrmRecommendation[]>([]);
  const [timeline, setTimeline] = useState<RecommendationTimelineEvent[]>([]);
  const [stats, setStats] = useState({ accepted: 0, rejected: 0 });

  const refreshRecommendations = useCallback(() => {
    if (leads.length === 0) return;

    const persisted = loadPersisted();
    const generated = leads.map((lead) => generateRecommendationForLead(lead));
    const merged = generated.map((rec) => {
      const existing = persisted?.recommendations.find((r) => r.leadId === rec.leadId);
      return existing ? { ...rec, status: existing.status } : rec;
    });

    const newTimeline = leads.flatMap((lead) => {
      const rec = merged.find((r) => r.leadId === lead.id)!;
      const existingEvents = persisted?.timeline.filter((e) => e.leadId === lead.id) ?? [];
      if (existingEvents.length > 0) return existingEvents;
      return buildInitialTimeline(lead, rec);
    });

    setRecommendations(merged);
    setTimeline(newTimeline);
    if (persisted?.stats) setStats(persisted.stats);
  }, [leads]);

  useEffect(() => {
    refreshRecommendations();
  }, [refreshRecommendations]);

  useEffect(() => {
    if (recommendations.length === 0) return;
    savePersisted({ recommendations, timeline, stats });
  }, [recommendations, timeline, stats]);

  const analytics = useMemo<RecommendationAnalytics>(() => {
    const generated = recommendations.length + stats.accepted + stats.rejected;
    const accepted = recommendations.filter(
      (r) => r.status === 'accepted' || r.status === 'completed',
    ).length;
    const rejected = recommendations.filter((r) => r.status === 'rejected').length + stats.rejected;
    const total = generated || 1;
    return {
      generated: recommendations.length,
      accepted,
      rejected,
      conversionRate: Math.round((accepted / total) * 1000) / 10,
    };
  }, [recommendations, stats]);

  const topToday = useMemo(
    () =>
      [...recommendations]
        .filter((r) => r.status === 'pending')
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5),
    [recommendations],
  );

  const getRecommendationForLead = useCallback(
    (leadId: string) => recommendations.find((r) => r.leadId === leadId) ?? null,
    [recommendations],
  );

  const getTimelineForLead = useCallback(
    (leadId: string) =>
      timeline
        .filter((e) => e.leadId === leadId)
        .sort((a, b) => a.timestamp - b.timestamp),
    [timeline],
  );

  const markCompleted = useCallback(
    (recommendationId: string, actionLabel: string) => {
      setRecommendations((prev) =>
        prev.map((r) =>
          r.id === recommendationId ? { ...r, status: 'completed' as const } : r,
        ),
      );
      const rec = recommendations.find((r) => r.id === recommendationId);
      if (rec) {
        setTimeline((prev) => [
          ...prev,
          {
            id: `${rec.leadId}-action-${Date.now()}`,
            leadId: rec.leadId,
            type: 'action_completed',
            label: `Action completed: ${actionLabel}`,
            timestamp: Date.now(),
          },
        ]);
      }
      setStats((s) => ({ ...s, accepted: s.accepted + 1 }));
    },
    [recommendations],
  );

  const executeAction = useCallback(
    (recommendationId: string, action?: RecommendationActionType) => {
      const rec = recommendations.find((r) => r.id === recommendationId);
      if (!rec) return;

      const lead = leads.find((l) => l.id === rec.leadId);
      const actionType = action ?? rec.actionType;
      const label = ACTION_LABELS[actionType];

      switch (actionType) {
        case 'schedule_demo':
          addAppointment({
            leadName: rec.leadName,
            leadCompany: rec.company,
            type: 'demo',
            time: '3:00 PM',
            date: 'Tomorrow',
            duration: '30 min',
            status: 'scheduled',
            assignedTo: 'Sara',
          });
          updateLead(rec.leadId, { status: 'contacted', priority: 'hot' });
          toast.success('Demo scheduled', {
            description: `${rec.leadName} · Tomorrow 3:00 PM with Sara`,
          });
          break;
        case 'assign_agent':
          updateLead(rec.leadId, {
            notes: `Assigned to Sara Chen · ${new Date().toLocaleDateString()}`,
            status: 'qualified',
          });
          toast.success('Assigned to sales agent', { description: `${rec.leadName} → Sara Chen` });
          break;
        case 'escalate_support':
          updateLead(rec.leadId, {
            notes: `Escalated to human support · Priority ticket opened`,
            priority: 'hot',
          });
          toast.success('Escalated to human support', {
            description: `${rec.leadName} routed to support team`,
          });
          break;
        case 'send_follow_up':
          updateLead(rec.leadId, { status: 'contacted' });
          toast.success('Follow-up campaign queued', {
            description: `WhatsApp sequence scheduled for ${rec.leadName}`,
          });
          break;
        case 'offer_discount':
          updateLead(rec.leadId, {
            notes: '15% discount offer sent via WhatsApp',
          });
          toast.success('Discount offer sent', { description: `15% off sent to ${rec.leadName}` });
          break;
        case 'recommend_enterprise':
          updateLead(rec.leadId, {
            notes: 'Enterprise Plan proposal shared',
            status: 'qualified',
          });
          toast.success('Enterprise plan recommended', {
            description: `Proposal sent to ${rec.company}`,
          });
          break;
        case 'create_lead':
          if (lead) {
            addLead({
              name: `${lead.name} (Referral)`,
              company: lead.company,
              email: `referral.${lead.email}`,
              phone: lead.phone,
              channel: lead.channel,
              priority: 'warm',
              status: 'new',
              aiScore: 72,
              value: Math.round(lead.value * 0.5),
            });
          }
          toast.success('Lead created', { description: 'Referral lead added to pipeline' });
          break;
        case 'start_ai_call':
          navigate(`/voice?name=${encodeURIComponent(rec.leadName)}`);
          toast.success('AI call initiated', { description: `Calling ${rec.leadName}…` });
          break;
        case 'send_to_crm':
          updateLead(rec.leadId, {
            notes: `Synced to HubSpot CRM · ${new Date().toLocaleString()}`,
          });
          toast.success('Sent to CRM', { description: `${rec.leadName} synced to HubSpot` });
          break;
        default:
          toast.success(`${label} completed`);
      }

      markCompleted(recommendationId, label);
    },
    [recommendations, leads, addAppointment, updateLead, addLead, navigate, markCompleted],
  );

  const rejectRecommendation = useCallback((recommendationId: string) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === recommendationId ? { ...r, status: 'rejected' as const } : r)),
    );
    setStats((s) => ({ ...s, rejected: s.rejected + 1 }));
    toast('Recommendation dismissed');
  }, []);

  const value = useMemo(
    () => ({
      recommendations,
      timeline,
      analytics,
      topToday,
      getRecommendationForLead,
      getTimelineForLead,
      executeAction,
      rejectRecommendation,
      refreshRecommendations,
    }),
    [
      recommendations,
      timeline,
      analytics,
      topToday,
      getRecommendationForLead,
      getTimelineForLead,
      executeAction,
      rejectRecommendation,
      refreshRecommendations,
    ],
  );

  return (
    <CrmRecommendationsContext.Provider value={value}>{children}</CrmRecommendationsContext.Provider>
  );
}

export function useCrmRecommendations() {
  const ctx = useContext(CrmRecommendationsContext);
  if (!ctx) {
    throw new Error('useCrmRecommendations must be used within CrmRecommendationsProvider');
  }
  return ctx;
}
