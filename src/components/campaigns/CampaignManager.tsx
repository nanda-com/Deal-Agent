import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  Sparkles,
  Users,
  BarChart3,
  TrendingUp,
  Eye,
  Loader2,
  Megaphone,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge, GlassCard } from '@/components/ui-kit/Card';
import { useCampaigns } from '@/contexts/CampaignsContext';
import { useLeadsContext } from '@/contexts/LeadsContext';
import { useGenerateCampaignMessage } from '@/hooks/useAi';
import { CampaignDetailModal } from '@/components/campaigns/CampaignDetailModal';
import {
  AUDIENCE_FILTERS,
  CAMPAIGN_TYPES,
  fallbackCampaignMessage,
  filterLeadsForAudience,
  type AudienceFilter,
  type AudienceFilterType,
  type CampaignType,
  type LeadSentiment,
} from '@/lib/campaigns';
import { channelMeta, type Channel } from '@/types';

const STATUS_CLASS: Record<string, string> = {
  draft: 'text-muted-foreground bg-white/8',
  scheduled: 'text-sky-300 bg-sky-400/15',
  sending: 'text-accent bg-accent/15',
  completed: 'text-emerald-300 bg-emerald-400/15',
  failed: 'text-rose-300 bg-rose-400/15',
};

export function CampaignDashboard() {
  const { leads, loading: leadsLoading } = useLeadsContext();
  const {
    campaigns,
    aggregateStats,
    selectedCampaign,
    sendingProgress,
    sendingCampaignId,
    setSelectedCampaign,
    createCampaign,
    sendCampaign,
    previewAudience,
  } = useCampaigns();
  const { generate: generateMessage, loading: aiLoading } = useGenerateCampaignMessage();

  const [name, setName] = useState('');
  const [type, setType] = useState<CampaignType>('promotional');
  const [message, setMessage] = useState(
    fallbackCampaignMessage('promotional', 'Summer Promo'),
  );
  const [audienceType, setAudienceType] = useState<AudienceFilterType>('all');
  const [channelFilter, setChannelFilter] = useState<Channel>('whatsapp');
  const [sentimentFilter, setSentimentFilter] = useState<LeadSentiment>('positive');
  const [scheduleAt, setScheduleAt] = useState('');

  const audienceFilter = useMemo<AudienceFilter>(
    () => ({
      type: audienceType,
      channel: audienceType === 'channel' ? channelFilter : undefined,
      sentiment: audienceType === 'sentiment' ? sentimentFilter : undefined,
    }),
    [audienceType, channelFilter, sentimentFilter],
  );

  const audiencePreview = previewAudience(audienceFilter);

  const handleGenerate = async () => {
    const campaignName = name.trim() || 'WhatsApp Campaign';
    const generated =
      (await generateMessage({
        campaignName,
        campaignType: type,
        audienceDescription: audiencePreview.label,
      })) ?? fallbackCampaignMessage(type, campaignName);
    setMessage(generated);
    toast.success('AI message generated', {
      description: 'Personalized with {{name}} and {{company}} tokens',
    });
  };

  const handleCreateAndSend = async (sendNow: boolean) => {
    if (!name.trim()) {
      toast.error('Campaign name is required');
      return;
    }
    if (!message.trim()) {
      toast.error('Message template is required');
      return;
    }
    if (audiencePreview.count === 0) {
      toast.error('No leads match this audience filter');
      return;
    }

    const campaign = createCampaign({
      name: name.trim(),
      type,
      message: message.trim(),
      audienceFilter,
      scheduleAt: sendNow ? null : scheduleAt || null,
    });

    if (sendNow) {
      await sendCampaign(campaign.id, (updated) => {
        toast.success('Campaign sent!', {
          description: `Delivered to ${updated.audienceCount} WhatsApp contacts (demo mode)`,
        });
        setSelectedCampaign(updated);
      });
    } else if (scheduleAt) {
      toast.success('Campaign scheduled', { description: `Scheduled for ${scheduleAt}` });
    } else {
      toast.success('Campaign saved as draft');
    }

    setName('');
    setMessage(fallbackCampaignMessage(type, 'New Campaign'));
    setScheduleAt('');
  };

  return (
    <div className="space-y-6">
      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Campaigns', value: aggregateStats.totalCampaigns, icon: Megaphone },
          { label: 'Messages Sent', value: aggregateStats.messagesSent, icon: Send },
          { label: 'Delivery Rate', value: `${aggregateStats.deliveryRate}%`, icon: CheckCircle },
          { label: 'Open Rate', value: `${aggregateStats.openRate}%`, icon: Eye },
          { label: 'Conversion Rate', value: `${aggregateStats.conversionRate}%`, icon: TrendingUp },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <GlassCard>
                <Icon className="w-4 h-4 text-accent mb-2" />
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {kpi.label}
                </div>
                <div className="text-2xl font-bold mt-1 tabular-nums">{kpi.value}</div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
        {/* Create Campaign */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-4 h-4 text-accent" />
            <h3 className="font-semibold">Create WhatsApp Campaign</h3>
            <Badge tone="info" className="ml-auto text-[10px]">Demo Mode</Badge>
          </div>

          <div className="space-y-4">
            <Field label="Campaign Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer Sale 2027"
                className="w-full h-10 px-3 rounded-xl bg-white/5 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Campaign Type">
                <select
                  value={type}
                  onChange={(e) => {
                    const next = e.target.value as CampaignType;
                    setType(next);
                    if (!message.includes('{{name}}')) {
                      setMessage(fallbackCampaignMessage(next, name || 'Campaign'));
                    }
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-white/5 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {CAMPAIGN_TYPES.map((t) => (
                    <option key={t.value} value={t.value} className="bg-[#0f172a]">
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Schedule Time">
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(e) => setScheduleAt(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 rounded-xl bg-white/5 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </Field>
            </div>

            <Field label="Target Audience">
              <div className="flex flex-wrap gap-1.5 mb-3">
                {AUDIENCE_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setAudienceType(f.value)}
                    className={`px-3 h-8 rounded-lg text-xs font-medium transition ${
                      audienceType === f.value
                        ? 'grad-primary text-white'
                        : 'glass hover:bg-white/10 text-muted-foreground'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {audienceType === 'channel' && (
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value as Channel)}
                  className="w-full h-10 px-3 rounded-xl bg-white/5 border border-border text-sm mb-2"
                >
                  {Object.entries(channelMeta).map(([key, meta]) => (
                    <option key={key} value={key} className="bg-[#0f172a]">
                      {meta.label}
                    </option>
                  ))}
                </select>
              )}

              {audienceType === 'sentiment' && (
                <div className="flex gap-1.5 mb-2">
                  {(['positive', 'neutral', 'negative'] as LeadSentiment[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSentimentFilter(s)}
                      className={`px-3 h-8 rounded-lg text-xs capitalize transition ${
                        sentimentFilter === s ? 'grad-primary text-white' : 'glass hover:bg-white/10'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground glass rounded-lg px-3 py-2">
                <Users className="w-3.5 h-3.5 text-accent" />
                {leadsLoading ? 'Loading leads…' : audiencePreview.label}
              </div>
            </Field>

            <Field label="Message Template">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Hi {{name}}, message for {{company}}…"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-muted-foreground">
                  Use {'{{name}}'} and {'{{company}}'} for personalization
                </span>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg glass hover:bg-white/10 text-xs font-medium text-accent transition disabled:opacity-50"
                >
                  {aiLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  Generate with AI
                </button>
              </div>
            </Field>

            {sendingProgress !== null && (
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-accent font-medium">Sending broadcast…</span>
                  <span className="tabular-nums">{sendingProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full grad-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${sendingProgress}%` }}
                    transition={{ ease: 'easeOut' }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Simulating WhatsApp delivery to {audiencePreview.count} contacts…
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={sendingCampaignId !== null}
                onClick={() => handleCreateAndSend(true)}
                className="flex-1 min-w-[140px] h-11 rounded-xl grad-primary text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition"
              >
                <Send className="w-4 h-4" />
                Send Now
              </button>
              <button
                type="button"
                disabled={sendingCampaignId !== null}
                onClick={() => handleCreateAndSend(false)}
                className="h-11 px-5 rounded-xl glass hover:bg-white/10 text-sm font-medium transition disabled:opacity-50"
              >
                Save {scheduleAt ? 'Scheduled' : 'Draft'}
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Audience preview panel */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-accent" />
            <h3 className="font-semibold">Audience Preview</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Real leads from your CRM matching the selected filters
          </p>
          <div className="text-3xl font-bold text-primary tabular-nums mb-1">
            {audiencePreview.count}
          </div>
          <p className="text-sm text-muted-foreground mb-4">contacts targeted</p>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {leadsLoading ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : (
              filterLeadsForAudience(leads, audienceFilter)
                .slice(0, 8)
                .map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center gap-2 text-xs glass rounded-lg px-2.5 py-2"
                  >
                    <div className="w-7 h-7 rounded-lg grad-primary grid place-items-center text-[10px] font-bold shrink-0">
                      {lead.name
                        .split(' ')
                        .map((p) => p[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{lead.name}</div>
                      <div className="text-muted-foreground truncate">{lead.company}</div>
                    </div>
                    <Badge
                      tone={
                        lead.priority === 'hot'
                          ? 'danger'
                          : lead.priority === 'warm'
                            ? 'warning'
                            : 'info'
                      }
                      className="text-[9px] shrink-0"
                    >
                      {lead.priority}
                    </Badge>
                  </div>
                ))
            )}
            {!leadsLoading && audiencePreview.count > 8 && (
              <p className="text-[11px] text-muted-foreground text-center pt-1">
                +{audiencePreview.count - 8} more leads
              </p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Campaign History */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-semibold">Campaign History</h3>
          <span className="text-xs text-muted-foreground">{campaigns.length} campaigns</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Campaign</th>
                <th className="text-left px-5 py-3">Audience</th>
                <th className="text-left px-5 py-3">Sent Time</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Results</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((camp, i) => (
                <motion.tr
                  key={camp.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedCampaign(camp)}
                  className="border-t border-white/5 hover:bg-white/5 cursor-pointer transition"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span>💬</span>
                      <div>
                        <div className="font-medium">{camp.name}</div>
                        <div className="text-[11px] text-muted-foreground capitalize">
                          {camp.type.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground max-w-[180px] truncate">
                    {camp.audienceLabel}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {camp.sentAt ?? camp.scheduleAt ?? '—'}
                  </td>
                  <td className="px-5 py-3">
                    <Badge className={`text-[10px] ${STATUS_CLASS[camp.status]}`}>
                      {camp.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-xs">
                    {camp.sent > 0 ? (
                      <span>
                        {camp.delivered} del · {camp.opened} open · {camp.converted} conv
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {selectedCampaign && (
        <CampaignDetailModal
          campaign={campaigns.find((c) => c.id === selectedCampaign.id) ?? selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
