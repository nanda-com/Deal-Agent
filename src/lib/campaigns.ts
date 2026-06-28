import type { Channel, Lead, LeadPriority } from '@/types';

export type CampaignType =
  | 'promotional'
  | 'product_update'
  | 're_engagement'
  | 'announcement'
  | 'nurture';

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';

export type AudienceFilterType =
  | 'all'
  | 'hot'
  | 'warm'
  | 'cold'
  | 'channel'
  | 'sentiment';

export type LeadSentiment = 'positive' | 'neutral' | 'negative';

export interface AudienceFilter {
  type: AudienceFilterType;
  channel?: Channel;
  sentiment?: LeadSentiment;
}

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  channel: 'whatsapp';
  message: string;
  audienceFilter: AudienceFilter;
  audienceLabel: string;
  audienceCount: number;
  leadIds: string[];
  scheduleAt: string | null;
  sentAt: string | null;
  status: CampaignStatus;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  createdAt: string;
}

export const CAMPAIGN_TYPES: { value: CampaignType; label: string }[] = [
  { value: 'promotional', label: 'Promotional Offer' },
  { value: 'product_update', label: 'Product Update' },
  { value: 're_engagement', label: 'Re-engagement' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'nurture', label: 'Lead Nurture' },
];

export const AUDIENCE_FILTERS: { value: AudienceFilterType; label: string }[] = [
  { value: 'all', label: 'All Leads' },
  { value: 'hot', label: 'Hot Leads' },
  { value: 'warm', label: 'Warm Leads' },
  { value: 'cold', label: 'Cold Leads' },
  { value: 'channel', label: 'By Channel' },
  { value: 'sentiment', label: 'By Sentiment' },
];

export function getLeadSentiment(lead: Lead): LeadSentiment {
  if (lead.aiScore >= 75) return 'positive';
  if (lead.aiScore >= 45) return 'neutral';
  return 'negative';
}

export function filterLeadsForAudience(leads: Lead[], filter: AudienceFilter): Lead[] {
  switch (filter.type) {
    case 'all':
      return leads;
    case 'hot':
      return leads.filter((l) => l.priority === 'hot');
    case 'warm':
      return leads.filter((l) => l.priority === 'warm');
    case 'cold':
      return leads.filter((l) => l.priority === 'cold');
    case 'channel':
      return filter.channel ? leads.filter((l) => l.channel === filter.channel) : leads;
    case 'sentiment':
      return filter.sentiment
        ? leads.filter((l) => getLeadSentiment(l) === filter.sentiment)
        : leads;
    default:
      return leads;
  }
}

export function buildAudienceLabel(filter: AudienceFilter, count: number): string {
  const suffix = ` (${count} contact${count === 1 ? '' : 's'})`;
  switch (filter.type) {
    case 'all':
      return `All leads${suffix}`;
    case 'hot':
      return `Hot leads${suffix}`;
    case 'warm':
      return `Warm leads${suffix}`;
    case 'cold':
      return `Cold leads${suffix}`;
    case 'channel':
      return `${filter.channel ?? 'All channels'} leads${suffix}`;
    case 'sentiment':
      return `${filter.sentiment ?? 'All'} sentiment${suffix}`;
    default:
      return `Audience${suffix}`;
  }
}

export function personalizeMessage(template: string, lead: Lead): string {
  return template
    .replace(/\{\{name\}\}/gi, lead.name.split(' ')[0])
    .replace(/\{\{company\}\}/gi, lead.company)
    .replace(/\{\{full_name\}\}/gi, lead.name);
}

export function simulateCampaignResults(audienceCount: number) {
  if (audienceCount === 0) {
    return { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0 };
  }
  const sent = audienceCount;
  const delivered = Math.floor(sent * (0.93 + Math.random() * 0.05));
  const opened = Math.floor(delivered * (0.68 + Math.random() * 0.18));
  const clicked = Math.floor(opened * (0.38 + Math.random() * 0.14));
  const converted = Math.max(1, Math.floor(clicked * (0.16 + Math.random() * 0.14)));
  return { sent, delivered, opened, clicked, converted };
}

export function campaignRates(campaign: Campaign) {
  const deliveryRate = campaign.sent > 0 ? (campaign.delivered / campaign.sent) * 100 : 0;
  const openRate = campaign.delivered > 0 ? (campaign.opened / campaign.delivered) * 100 : 0;
  const conversionRate = campaign.opened > 0 ? (campaign.converted / campaign.opened) * 100 : 0;
  return {
    deliveryRate: Math.round(deliveryRate * 10) / 10,
    openRate: Math.round(openRate * 10) / 10,
    conversionRate: Math.round(conversionRate * 10) / 10,
  };
}

export function fallbackCampaignMessage(type: CampaignType, campaignName: string): string {
  const templates: Record<CampaignType, string> = {
    promotional:
      'Hi {{name}}! 👋 Exclusive offer for {{company}} — get 20% off OmniFlow Pro this week. Reply YES to claim your discount.',
    product_update:
      'Hey {{name}}, great news for {{company}}! OmniFlow just launched AI voice campaigns and advanced analytics. Want a quick demo?',
    re_engagement:
      'Hi {{name}}, we miss you at {{company}}! Come back and get a free AI consultation. Reply BOOK to schedule with our team.',
    announcement:
      'Hello {{name}}! 📢 Important update for {{company}}: OmniFlow now supports WhatsApp broadcasts with Gemini personalization.',
    nurture:
      'Hi {{name}}, thought {{company}} might find this useful — 3 ways AI inbox automation saves 10+ hours/week. Reply LEARN for the guide.',
  };
  return templates[type] ?? `Hi {{name}}! ${campaignName} — a special message for {{company}} from OmniFlow.`;
}

export const CAMPAIGNS_STORAGE_KEY = 'omniflow_campaigns';

export function priorityLabel(p: LeadPriority): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}
