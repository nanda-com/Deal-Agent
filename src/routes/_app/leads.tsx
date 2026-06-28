import type { ReactNode } from 'react';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Filter, Search, X, Phone, Mail, Building2, Sparkles, RefreshCw, AlertCircle, Users, Target, TrendingUp, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, GlassCard } from '@/components/ui-kit/Card';
import { SkeletonTable } from '@/components/ui-kit/Skeleton';
import { EmptyState } from '@/components/ui-kit/EmptyState';
import { channelMeta } from '@/types';
import type { Lead } from '@/types';
import { useUpdateLead } from '@/hooks/useLeads';
import { useLeadsContext } from '@/contexts/LeadsContext';
import { useAiLeadScore } from '@/hooks/useAi';
import { LeadScoringModal } from '@/components/leads/LeadScoringModal';
import { SmartRecommendationCard } from '@/components/crm/SmartRecommendationCard';
import { RecommendationTimeline } from '@/components/crm/RecommendationTimeline';

export function LeadsPage() {
  const [q, setQ] = useState('');
  const [priority, setPriority] = useState<string>('all');
  const [active, setActive] = useState<Lead | null>(null);
  const [scoringLeadId, setScoringLeadId] = useState<string | null>(null);

  const {
    leads: leadsData,
    loading,
    error,
    refetch,
    syncToSheets,
    syncLoading,
    syncStatus,
    lastSyncAt,
    totalSyncedRows,
    syncHistory,
  } = useLeadsContext();
  const { update: updateLead } = useUpdateLead();
  const { score: scoreLead, loading: scoringLoading, result: scoreResult } = useAiLeadScore();

  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const locationState = location.state as { openLeadId?: string } | null;
  const deepLinkHandled = useRef(false);

  const leadsList = leadsData ?? [];

  // Client-side filtering for priority + search
  const filtered = useMemo(
    () => {
      let result = leadsList;
      if (priority !== 'all') {
        result = result.filter((lead) => lead.priority === priority);
      }
      if (q) {
        result = result.filter(
          (lead) =>
            lead.name.toLowerCase().includes(q.toLowerCase()) ||
            lead.company.toLowerCase().includes(q.toLowerCase()),
        );
      }
      return result;
    },
    [leadsList, q, priority],
  );

  // Auto-open lead from location state (e.g., navigated from inbox)
  useEffect(() => {
    if (locationState?.openLeadId && leadsList.length > 0) {
      const found = leadsList.find((l) => l.id === locationState.openLeadId);
      if (found) {
        setActive(found);
        window.history.replaceState({}, '');
      }
    }
  }, [locationState?.openLeadId, leadsList]);

  // Deep link: /leads?id=456
  useEffect(() => {
    const leadId = searchParams.get('id');
    const fallbackName = searchParams.get('name');
    if (!leadId) {
      deepLinkHandled.current = false;
      return;
    }
    if (loading || leadsList.length === 0) return;

    const found =
      leadsList.find((l) => l.id === leadId) ??
      (fallbackName ? leadsList.find((l) => l.name === fallbackName) : undefined);
    if (found) {
      setActive(found);
      setQ('');
      setPriority('all');
      requestAnimationFrame(() => {
        document.getElementById(`lead-row-${found.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    if (!deepLinkHandled.current) {
      deepLinkHandled.current = true;
      toast.error('Related item not found');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, leadsList, loading, setSearchParams]);

  const exportCSV = () => {
    const csv = [
      ['Name', 'Company', 'Email', 'Phone', 'Channel', 'Priority', 'Status', 'Value', 'AI Score'].join(','),
      ...filtered.map((lead) =>
        [lead.name, lead.company, lead.email, lead.phone, lead.channel, lead.priority, lead.status, lead.value.toString(), lead.aiScore.toString()].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'leads.csv';
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Exported leads.csv');
  };

  if (loading && !leadsData) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="glass rounded-2xl p-5">
          <SkeletonTable rows={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-32">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <p className="mt-4 text-sm text-rose-300 font-medium">Failed to load leads</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          <button onClick={refetch} className="mt-4 px-4 h-10 rounded-xl glass text-sm hover:bg-white/10 transition">Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">Auto-captured from every conversation · {filtered.length} of {leadsList.length}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={refetch} className="h-10 px-4 rounded-xl glass hover:bg-white/10 text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={syncToSheets}
            disabled={syncLoading}
            className="h-10 px-4 rounded-xl glass hover:bg-white/10 text-sm flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            {syncLoading ? 'Syncing leads to Google Sheets...' : syncStatus === 'synced' ? 'Synced ✓' : 'Sync to Sheets'}
          </button>
          <button onClick={exportCSV} className="h-10 px-4 rounded-xl grad-primary text-white text-sm font-semibold flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <GlassCard className="p-4 grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div>
            <div className="text-sm text-muted-foreground">Google Sheets sync</div>
            <h2 className="text-xl font-semibold mt-1">Lead sync status</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl glass p-4">
              <div className="text-[11px] uppercase text-muted-foreground tracking-[0.24em] mb-2">Last sync</div>
              <div className="text-sm font-semibold">{lastSyncAt ?? 'Never'}</div>
            </div>
            <div className="rounded-2xl glass p-4">
              <div className="text-[11px] uppercase text-muted-foreground tracking-[0.24em] mb-2">Total rows</div>
              <div className="text-sm font-semibold">{totalSyncedRows.toLocaleString()}</div>
            </div>
            <div className="rounded-2xl glass p-4 col-span-2">
              <div className="text-[11px] uppercase text-muted-foreground tracking-[0.24em] mb-2">Sync status</div>
              <div className="text-sm font-semibold capitalize">{syncStatus}</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl glass p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">History</div>
              <div className="text-xs text-muted-foreground">Last 10 operations</div>
            </div>
          </div>
          {syncHistory.length === 0 ? (
            <div className="text-sm text-muted-foreground">No sync operations yet.</div>
          ) : (
            <div className="space-y-2">
              {syncHistory.map((entry) => (
                <div key={entry.id} className="rounded-2xl glass p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{entry.time}</div>
                    <div className="text-xs text-muted-foreground">{entry.rowsSynced} rows</div>
                  </div>
                  <span className={`text-[11px] px-2 py-1 rounded-full ${entry.status === 'success' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search by name or company…"
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
          <div className="flex gap-1.5">
            {['all', 'hot', 'warm', 'cold'].map((option) => (
              <button
                key={option}
                onClick={() => setPriority(option)}
                className={`px-3 h-10 rounded-xl text-xs font-medium capitalize transition ${
                  priority === option ? 'grad-primary text-white' : 'glass hover:bg-white/10'
                }`}
              >
                {option === 'all' ? <><Filter className="w-3.5 h-3.5 inline mr-1" /> All</> : option}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Lead</th>
                <th className="text-left px-5 py-3">Channel</th>
                <th className="text-left px-5 py-3">Priority</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">AI Score</th>
                <th className="text-right px-5 py-3">Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, index) => (
                <motion.tr
                  key={lead.id}
                  id={`lead-row-${lead.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => setActive(lead)}
                  className={`border-t border-white/5 hover:bg-white/3 cursor-pointer transition ${
                    active?.id === lead.id ? 'bg-primary/10 ring-1 ring-inset ring-primary/30' : ''
                  }`}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl glass-strong grid place-items-center text-xs font-semibold">
                        {lead.name.split(' ').map((part) => part[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-xs text-muted-foreground">{lead.company}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs ${channelMeta[lead.channel].color}`}>● {channelMeta[lead.channel].label}</span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={lead.priority === 'hot' ? 'danger' : lead.priority === 'warm' ? 'warning' : 'info'}>
                      {lead.priority}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge>{lead.status}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full grad-primary" style={{ width: `${lead.aiScore}%` }} />
                      </div>
                      <span className="text-xs font-medium">{lead.aiScore}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">${lead.value.toLocaleString()}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <AnimatePresence>
        {active && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setActive(null)}>
            <motion.aside
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 26 }}
              onClick={(event: React.MouseEvent<HTMLDivElement>) => event.stopPropagation()}
              className="absolute right-0 top-0 h-full w-full max-w-md glass-strong p-6 overflow-y-auto"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="w-14 h-14 rounded-2xl grad-primary grid place-items-center text-lg font-bold">{active.name.split(' ').map((part) => part[0]).join('')}</div>
                  <h2 className="text-xl font-bold mt-3">{active.name}</h2>
                  <div className="text-sm text-muted-foreground">{active.company}</div>
                </div>
                <button onClick={() => setActive(null)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Stat label="AI Score" value={`${active.aiScore}`} />
                <Stat label="Deal value" value={`$${active.value.toLocaleString()}`} />
                <Stat label="Priority" value={active.priority} />
                <Stat label="Status" value={active.status} />
              </div>

              {/* AI Scoring Breakdown Button */}
              <button
                onClick={() => setScoringLeadId(active.id)}
                className="mt-4 w-full h-10 rounded-xl grad-primary text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition active:scale-[0.98]"
              >
                <Target className="w-4 h-4" />
                View AI Scoring Breakdown
              </button>
              <div className="mt-6 space-y-2 text-sm">
                <InfoRow icon={<Mail className="w-4 h-4" />} text={active.email} />
                <InfoRow icon={<Phone className="w-4 h-4" />} text={active.phone} />
                <InfoRow icon={<Building2 className="w-4 h-4" />} text={active.company} />
              </div>
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">AI scoring</div>
                  <button
                    onClick={() => {
                      const mockHistory = [
                        { role: 'user', text: 'Hi, interested in your product.' },
                        { role: 'ai', text: "I'd be happy to help! What caught your eye?" },
                      ];
                      scoreLead(active.id, mockHistory);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium transition ${scoringLoading ? 'glass opacity-60' : 'glass hover:bg-white/10'}`}
                    disabled={scoringLoading}
                  >
                    {scoringLoading ? 'Scoring…' : 'Re-score with AI'}
                  </button>
                </div>
                <div className="glass rounded-xl p-4 space-y-3">
                  {scoreResult ? (
                    <>
                      <p className="text-sm leading-relaxed">{scoreResult.summary}</p>
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                        <div>
                          <span className="text-[10px] uppercase text-muted-foreground">Score</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <div className="h-full grad-primary" style={{ width: scoreResult.score + '%' }} />
                            </div>
                            <span className="text-sm font-semibold">{scoreResult.score}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-muted-foreground">Priority</span>
                          <div className="mt-0.5">
                            <Badge tone={scoreResult.priority === 'hot' ? 'danger' : scoreResult.priority === 'warm' ? 'warning' : 'info'}>
                              {scoreResult.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {scoreResult.suggestedAction && (
                        <p className="text-xs text-muted-foreground italic border-t border-border/40 pt-2">
                          Suggested: {scoreResult.suggestedAction}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm leading-relaxed">
                      {active.name} engaged via {channelMeta[active.channel].label}. Gemini classified as <b>{active.priority}</b> (score: {active.aiScore}). Click <b>Re-score</b> for detailed AI analysis.
                    </p>
                  )}
                </div>
              </div>

              {/* Smart CRM Recommendations */}
              <SmartRecommendationCard leadId={active.id} compact className="mt-6" />
              <RecommendationTimeline leadId={active.id} />

              <div className="mt-6 grid grid-cols-2 gap-2">
                <button onClick={() => toast.success('Email drafted by AI')} className="h-10 rounded-xl glass hover:bg-white/10 text-sm">
                  Draft email
                </button>
                <button onClick={() => toast.success('Call scheduled')} className="h-10 rounded-xl grad-primary text-white text-sm font-semibold">
                  Book call
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Lead Scoring Modal */}
      <LeadScoringModal
        leadId={scoringLeadId ?? ''}
        open={scoringLeadId !== null}
        onClose={() => setScoringLeadId(null)}
      />

    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold capitalize mt-0.5">{value}</div>
    </div>
  );
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="text-accent">{icon}</span>
      <span className="text-foreground truncate">{text}</span>
    </div>
  );
}
