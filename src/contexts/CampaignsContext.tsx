import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { campaigns as seedCampaigns } from '@/lib/mockData';
import { useLeadsContext } from '@/contexts/LeadsContext';
import {
  buildAudienceLabel,
  CAMPAIGNS_STORAGE_KEY,
  filterLeadsForAudience,
  simulateCampaignResults,
  type AudienceFilter,
  type Campaign,
  type CampaignStatus,
  type CampaignType,
} from '@/lib/campaigns';

interface CreateCampaignInput {
  name: string;
  type: CampaignType;
  message: string;
  audienceFilter: AudienceFilter;
  scheduleAt: string | null;
}

interface CampaignsContextValue {
  campaigns: Campaign[];
  selectedCampaign: Campaign | null;
  sendingProgress: number | null;
  sendingCampaignId: string | null;
  aggregateStats: {
    totalCampaigns: number;
    messagesSent: number;
    deliveryRate: number;
    openRate: number;
    conversionRate: number;
  };
  setSelectedCampaign: (campaign: Campaign | null) => void;
  createCampaign: (input: CreateCampaignInput) => Campaign;
  sendCampaign: (campaignId: string, onComplete?: (campaign: Campaign) => void) => Promise<void>;
  previewAudience: (filter: AudienceFilter) => { count: number; label: string; leadIds: string[] };
}

function seedToCampaign(raw: (typeof seedCampaigns)[number]): Campaign {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.name.toLowerCase().includes('sale') ? 'promotional' : 'product_update',
    channel: 'whatsapp',
    message: raw.message,
    audienceFilter: { type: 'all' },
    audienceLabel: raw.audience,
    audienceCount: raw.sent || 100,
    leadIds: [],
    scheduleAt: null,
    sentAt: raw.status === 'completed' ? raw.createdAt : null,
    status: raw.status as CampaignStatus,
    sent: raw.sent,
    delivered: raw.delivered,
    opened: raw.opened,
    clicked: raw.clicked,
    converted: raw.converted,
    createdAt: raw.createdAt,
  };
}

function loadCampaigns(): Campaign[] {
  if (typeof window === 'undefined') {
    return seedCampaigns.filter((c) => c.channel === 'whatsapp').map(seedToCampaign);
  }
  try {
    const raw = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Campaign[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* use seed */
  }
  return seedCampaigns.filter((c) => c.channel === 'whatsapp').map(seedToCampaign);
}

function persistCampaigns(campaigns: Campaign[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
}

const CampaignsContext = createContext<CampaignsContextValue | null>(null);

export function CampaignsProvider({ children }: { children: ReactNode }) {
  const { leads } = useLeadsContext();
  const [campaigns, setCampaigns] = useState<Campaign[]>(loadCampaigns);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [sendingProgress, setSendingProgress] = useState<number | null>(null);
  const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null);

  const previewAudience = useCallback(
    (filter: AudienceFilter) => {
      const matched = filterLeadsForAudience(leads, filter);
      const count = matched.length;
      return {
        count,
        label: buildAudienceLabel(filter, count),
        leadIds: matched.map((l) => l.id),
      };
    },
    [leads],
  );

  const aggregateStats = useMemo(() => {
    const completed = campaigns.filter((c) => c.status === 'completed' || c.sent > 0);
    const messagesSent = completed.reduce((s, c) => s + c.sent, 0);
    const totalDelivered = completed.reduce((s, c) => s + c.delivered, 0);
    const totalOpened = completed.reduce((s, c) => s + c.opened, 0);
    const totalConverted = completed.reduce((s, c) => s + c.converted, 0);

    return {
      totalCampaigns: campaigns.length,
      messagesSent,
      deliveryRate: messagesSent > 0 ? Math.round((totalDelivered / messagesSent) * 1000) / 10 : 0,
      openRate: totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 1000) / 10 : 0,
      conversionRate: totalOpened > 0 ? Math.round((totalConverted / totalOpened) * 1000) / 10 : 0,
    };
  }, [campaigns]);

  const createCampaign = useCallback(
    (input: CreateCampaignInput): Campaign => {
      const audience = previewAudience(input.audienceFilter);
      const campaign: Campaign = {
        id: `cmp-${Date.now()}`,
        name: input.name,
        type: input.type,
        channel: 'whatsapp',
        message: input.message,
        audienceFilter: input.audienceFilter,
        audienceLabel: audience.label,
        audienceCount: audience.count,
        leadIds: audience.leadIds,
        scheduleAt: input.scheduleAt,
        sentAt: null,
        status: input.scheduleAt ? 'scheduled' : 'draft',
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
        createdAt: new Date().toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      };
      setCampaigns((prev) => {
        const next = [campaign, ...prev];
        persistCampaigns(next);
        return next;
      });
      return campaign;
    },
    [previewAudience],
  );

  const sendCampaign = useCallback(
    async (campaignId: string, onComplete?: (campaign: Campaign) => void) => {
      const target = campaigns.find((c) => c.id === campaignId);
      if (!target) return;

      const audience = previewAudience(target.audienceFilter);
      const count = Math.max(audience.count, target.audienceCount);

      setSendingCampaignId(campaignId);
      setSendingProgress(0);

      setCampaigns((prev) => {
        const next = prev.map((c) =>
          c.id === campaignId ? { ...c, status: 'sending' as CampaignStatus } : c,
        );
        persistCampaigns(next);
        return next;
      });

      await new Promise<void>((resolve) => {
        let progress = 0;
        const interval = window.setInterval(() => {
          progress += 4 + Math.floor(Math.random() * 8);
          if (progress >= 100) {
            progress = 100;
            window.clearInterval(interval);
            resolve();
          }
          setSendingProgress(progress);
        }, 120);
      });

      const results = simulateCampaignResults(count);
      const sentAt = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

      const updated: Campaign = {
        ...target,
        ...results,
        audienceCount: count,
        leadIds: audience.leadIds,
        audienceLabel: audience.label,
        status: 'completed',
        sentAt,
      };

      setCampaigns((prev) => {
        const next = prev.map((c) => (c.id === campaignId ? updated : c));
        persistCampaigns(next);
        return next;
      });

      setSendingProgress(null);
      setSendingCampaignId(null);
      onComplete?.(updated);
    },
    [campaigns, previewAudience],
  );

  const value = useMemo(
    () => ({
      campaigns,
      selectedCampaign,
      sendingProgress,
      sendingCampaignId,
      aggregateStats,
      setSelectedCampaign,
      createCampaign,
      sendCampaign,
      previewAudience,
    }),
    [
      campaigns,
      selectedCampaign,
      sendingProgress,
      sendingCampaignId,
      aggregateStats,
      createCampaign,
      sendCampaign,
      previewAudience,
    ],
  );

  return <CampaignsContext.Provider value={value}>{children}</CampaignsContext.Provider>;
}

export function useCampaigns() {
  const ctx = useContext(CampaignsContext);
  if (!ctx) {
    throw new Error('useCampaigns must be used within CampaignsProvider');
  }
  return ctx;
}
