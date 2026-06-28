import type { Lead } from '@/types';
import { getLeadSentiment, type LeadSentiment } from '@/lib/campaigns';

export type RecommendationActionType =
  | 'schedule_demo'
  | 'assign_agent'
  | 'escalate_support'
  | 'send_follow_up'
  | 'offer_discount'
  | 'recommend_enterprise'
  | 'create_lead'
  | 'start_ai_call'
  | 'send_to_crm';

export type RecommendationStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface LeadEngagementProfile {
  leadScore: number;
  sentiment: LeadSentiment;
  daysInactive: number;
  pricingViews: number;
  isEnterprise: boolean;
  channelActivity: number;
}

export interface CrmRecommendation {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  title: string;
  reason: string;
  confidence: number;
  expectedConversion: number;
  expectedRevenue: number;
  actionType: RecommendationActionType;
  status: RecommendationStatus;
  priority: 'high' | 'medium' | 'low';
  createdAt: number;
}

export type TimelineEventType =
  | 'lead_created'
  | 'score_generated'
  | 'sentiment_analyzed'
  | 'recommendation_generated'
  | 'action_completed';

export interface RecommendationTimelineEvent {
  id: string;
  leadId: string;
  type: TimelineEventType;
  label: string;
  timestamp: number;
}

export interface RecommendationAnalytics {
  generated: number;
  accepted: number;
  rejected: number;
  conversionRate: number;
}

const ENTERPRISE_COMPANIES = [
  'Northwind Logistics',
  'Vertex Retail',
  'Helios Solar',
  'Pioneer Bank',
  'Atlas Manufacturing',
];

const DEMO_PROFILES: Record<string, Partial<LeadEngagementProfile>> = {
  'Emma Johansson': {
    leadScore: 87,
    sentiment: 'positive',
    daysInactive: 2,
    pricingViews: 2,
    isEnterprise: false,
    channelActivity: 8,
  },
  'Priya Sharma': {
    leadScore: 92,
    sentiment: 'positive',
    daysInactive: 1,
    pricingViews: 2,
    isEnterprise: false,
    channelActivity: 12,
  },
  'Zara Ali': {
    leadScore: 68,
    sentiment: 'negative',
    daysInactive: 9,
    pricingViews: 1,
    isEnterprise: false,
    channelActivity: 3,
  },
  'Aarav Mehta': {
    leadScore: 88,
    sentiment: 'neutral',
    daysInactive: 3,
    pricingViews: 2,
    isEnterprise: true,
    channelActivity: 6,
  },
};

function hashDays(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % 14;
  return h;
}

export function buildEngagementProfile(lead: Lead): LeadEngagementProfile {
  const demo = DEMO_PROFILES[lead.name];
  if (demo) {
    return {
      leadScore: demo.leadScore ?? lead.aiScore,
      sentiment: demo.sentiment ?? getLeadSentiment(lead),
      daysInactive: demo.daysInactive ?? hashDays(lead.name),
      pricingViews: demo.pricingViews ?? (lead.aiScore > 80 ? 3 : 1),
      isEnterprise:
        demo.isEnterprise ??
        (ENTERPRISE_COMPANIES.includes(lead.company) || lead.value > 45000),
      channelActivity: demo.channelActivity ?? Math.max(1, Math.floor(lead.aiScore / 12)),
    };
  }

  return {
    leadScore: lead.aiScore,
    sentiment: getLeadSentiment(lead),
    daysInactive: hashDays(lead.id) % 12,
    pricingViews: lead.aiScore > 85 ? 4 : lead.aiScore > 70 ? 2 : 0,
    isEnterprise: ENTERPRISE_COMPANIES.includes(lead.company) || lead.value > 45000,
    channelActivity: Math.max(1, Math.floor(lead.aiScore / 10)),
  };
}

interface RecommendationRule {
  title: string;
  reason: (lead: Lead, profile: LeadEngagementProfile) => string;
  actionType: RecommendationActionType;
  confidence: (profile: LeadEngagementProfile) => number;
  expectedConversion: (profile: LeadEngagementProfile) => number;
  priority: 'high' | 'medium' | 'low';
  match: (profile: LeadEngagementProfile) => boolean;
}

const RULES: RecommendationRule[] = [
  {
    title: 'Escalate to Human Support',
    match: (p) => p.sentiment === 'negative',
    reason: (lead) =>
      `Negative sentiment detected for ${lead.name}. Customer frustration signals require human intervention.`,
    actionType: 'escalate_support',
    confidence: (p) => Math.min(96, 78 + p.channelActivity),
    expectedConversion: () => 42,
    priority: 'high',
  },
  {
    title: 'Send Follow-Up Campaign',
    match: (p) => p.daysInactive >= 7,
    reason: (lead, p) =>
      `No activity for ${p.daysInactive} days. Re-engage ${lead.name} with a personalized WhatsApp follow-up.`,
    actionType: 'send_follow_up',
    confidence: (p) => Math.min(88, 62 + p.leadScore / 4),
    expectedConversion: (p) => Math.round(28 + p.leadScore / 5),
    priority: 'medium',
  },
  {
    title: 'Assign to Sales Agent',
    match: (p) => p.leadScore > 90 && p.sentiment === 'positive',
    reason: (lead, p) =>
      `Lead score ${p.leadScore} and positive buying intent detected for ${lead.name}. Route to senior sales.`,
    actionType: 'assign_agent',
    confidence: (p) => Math.min(97, p.leadScore - 2),
    expectedConversion: (p) => Math.round(p.leadScore * 0.82),
    priority: 'high',
  },
  {
    title: 'Recommend Enterprise Plan',
    match: (p) => p.isEnterprise,
    reason: (lead) =>
      `${lead.company} matches enterprise ICP. Propose Enterprise Plan with dedicated success manager.`,
    actionType: 'recommend_enterprise',
    confidence: (p) => Math.min(94, 70 + p.leadScore / 3),
    expectedConversion: (p) => Math.round(55 + p.leadScore / 6),
    priority: 'high',
  },
  {
    title: 'Offer Discount',
    match: (p) => p.pricingViews >= 3,
    reason: (lead, p) =>
      `Customer viewed pricing ${p.pricingViews} times. Time-sensitive discount may accelerate ${lead.name}'s decision.`,
    actionType: 'offer_discount',
    confidence: (p) => Math.min(91, 65 + p.pricingViews * 6),
    expectedConversion: (p) => Math.round(48 + p.leadScore / 4),
    priority: 'medium',
  },
  {
    title: 'Schedule Demo',
    match: (p) => p.leadScore > 85,
    reason: (lead, p) =>
      `Lead score ${p.leadScore} and positive buying intent detected for ${lead.name}. Book a product demo.`,
    actionType: 'schedule_demo',
    confidence: (p) => Math.min(95, p.leadScore - 4),
    expectedConversion: (p) => Math.round(p.leadScore * 0.78),
    priority: 'high',
  },
];

export function generateRecommendationForLead(lead: Lead): CrmRecommendation {
  const profile = buildEngagementProfile(lead);
  const rule = RULES.find((r) => r.match(profile)) ?? RULES[RULES.length - 1];

  return {
    id: `rec-${lead.id}`,
    leadId: lead.id,
    leadName: lead.name,
    company: lead.company,
    title: rule.title,
    reason: rule.reason(lead, profile),
    confidence: Math.round(rule.confidence(profile)),
    expectedConversion: rule.expectedConversion(profile),
    expectedRevenue: Math.round(lead.value * (rule.expectedConversion(profile) / 100)),
    actionType: rule.actionType,
    status: 'pending',
    priority: rule.priority,
    createdAt: Date.now(),
  };
}

export function buildInitialTimeline(
  lead: Lead,
  recommendation: CrmRecommendation,
): RecommendationTimelineEvent[] {
  const now = Date.now();
  return [
    {
      id: `${lead.id}-tl-1`,
      leadId: lead.id,
      type: 'lead_created',
      label: 'Lead created',
      timestamp: now - 86400000 * 14,
    },
    {
      id: `${lead.id}-tl-2`,
      leadId: lead.id,
      type: 'score_generated',
      label: `AI lead score generated (${lead.aiScore})`,
      timestamp: now - 86400000 * 3,
    },
    {
      id: `${lead.id}-tl-3`,
      leadId: lead.id,
      type: 'sentiment_analyzed',
      label: `Sentiment analyzed (${buildEngagementProfile(lead).sentiment})`,
      timestamp: now - 86400000 * 2,
    },
    {
      id: `${lead.id}-tl-4`,
      leadId: lead.id,
      type: 'recommendation_generated',
      label: `Recommendation generated: ${recommendation.title}`,
      timestamp: now - 3600000,
    },
  ];
}

export const ACTION_LABELS: Record<RecommendationActionType, string> = {
  schedule_demo: 'Schedule Demo',
  assign_agent: 'Assign Agent',
  escalate_support: 'Escalate Support',
  send_follow_up: 'Send Follow-Up',
  create_lead: 'Create Lead',
  start_ai_call: 'Start AI Call',
  send_to_crm: 'Send to CRM',
  offer_discount: 'Offer Discount',
  recommend_enterprise: 'Enterprise Plan',
};

export const CRM_STORAGE_KEY = 'omniflow_crm_recommendations';
