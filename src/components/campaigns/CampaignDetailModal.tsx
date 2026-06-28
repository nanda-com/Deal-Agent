import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Eye,
  MousePointerClick,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';
import { Badge, GlassCard } from '@/components/ui-kit/Card';
import { useCampaigns } from '@/contexts/CampaignsContext';
import { useLeadsContext } from '@/contexts/LeadsContext';
import { campaignRates, personalizeMessage } from '@/lib/campaigns';
import type { Campaign } from '@/lib/campaigns';

const STATUS_TONE: Record<Campaign['status'], 'default' | 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
  draft: 'default',
  scheduled: 'info',
  sending: 'primary',
  completed: 'success',
  failed: 'danger',
};

interface CampaignDetailModalProps {
  campaign: Campaign;
  onClose: () => void;
}

export function CampaignDetailModal({ campaign, onClose }: CampaignDetailModalProps) {
  const { leads } = useLeadsContext();
  const rates = campaignRates(campaign);

  const sampleLeads = useMemo(() => {
    const ids = new Set(campaign.leadIds);
    return leads.filter((l) => ids.has(l.id)).slice(0, 5);
  }, [campaign.leadIds, leads]);

  const previewLead = sampleLeads[0] ?? leads[0];
  const previewMessage = previewLead
    ? personalizeMessage(campaign.message, previewLead)
    : campaign.message;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.96, y: 16 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ring-glow"
        >
          <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">💬</span>
                <Badge tone={STATUS_TONE[campaign.status]}>{campaign.status}</Badge>
              </div>
              <h2 className="text-xl font-bold">{campaign.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{campaign.audienceLabel}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Metric icon={Send} label="Sent" value={campaign.sent} />
              <Metric icon={CheckCircle} label="Delivered" value={campaign.delivered} accent="text-emerald-400" />
              <Metric icon={Eye} label="Opened" value={campaign.opened} accent="text-cyan-400" />
              <Metric icon={MousePointerClick} label="Converted" value={campaign.converted} accent="text-amber-400" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <RateCard label="Delivery Rate" value={`${rates.deliveryRate}%`} />
              <RateCard label="Open Rate" value={`${rates.openRate}%`} />
              <RateCard label="Conversion Rate" value={`${rates.conversionRate}%`} />
            </div>

            <div className="h-2 rounded-full bg-white/10 overflow-hidden flex">
              <div
                className="h-full bg-emerald-400/70"
                style={{ width: `${rates.deliveryRate}%` }}
              />
              <div
                className="h-full bg-cyan-400/70"
                style={{ width: `${rates.openRate * 0.6}%` }}
              />
              <div
                className="h-full bg-amber-400/70"
                style={{ width: `${rates.conversionRate * 0.4}%` }}
              />
            </div>

            <GlassCard>
              <div className="flex items-center gap-2 text-xs text-accent mb-2">
                <MessageSquare className="w-3.5 h-3.5" /> Message preview
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{previewMessage}</p>
              {previewLead && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  Preview for {previewLead.name} · {previewLead.company}
                </p>
              )}
            </GlassCard>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Campaign type</span>
                <p className="font-medium capitalize">{campaign.type.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Sent time</span>
                <p className="font-medium">{campaign.sentAt ?? campaign.scheduleAt ?? 'Not sent'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Created</span>
                <p className="font-medium">{campaign.createdAt}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Audience size</span>
                <p className="font-medium">{campaign.audienceCount} leads</p>
              </div>
            </div>

            {sampleLeads.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Targeted leads (sample)
                </p>
                <div className="space-y-2">
                  {sampleLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between text-sm glass rounded-lg px-3 py-2"
                    >
                      <span>
                        {lead.name} · {lead.company}
                      </span>
                      <Badge tone={lead.priority === 'hot' ? 'danger' : lead.priority === 'warm' ? 'warning' : 'info'}>
                        {lead.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Send;
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/5 p-3 text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 ${accent ?? 'text-muted-foreground'}`} />
      <div className={`text-lg font-bold tabular-nums ${accent ?? ''}`}>{value.toLocaleString()}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function RateCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/5 p-3 text-center">
      <div className="text-lg font-bold text-primary">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
