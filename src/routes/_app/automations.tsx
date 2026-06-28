import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bot, Plus, Zap, RefreshCw, AlertCircle, Rocket, GitBranch, Mail, BarChart3, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, GlassCard } from '@/components/ui-kit/Card';
import { SkeletonCard } from '@/components/ui-kit/Skeleton';
import { EmptyState } from '@/components/ui-kit/EmptyState';
import { channelMeta } from '@/types';
import type { Automation } from '@/types';
import { useAutomations, useToggleAutomation } from '@/hooks/useAutomations';
import { WorkflowBuilder } from '@/components/automations/WorkflowBuilder'
import { followUpRules } from '@/lib/mockData'

export function AutomationsPage() {
  const { data: rulesData, loading, error, refetch } = useAutomations();
  const { toggle: toggleAutomation } = useToggleAutomation();
  const rules = rulesData ?? [];

  const toggle = useCallback(async (id: string) => {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;
    const updated = await toggleAutomation(id, !rule.active);
    if (updated) {
      toast.success('Automation ' + (updated.active ? 'activated' : 'paused'));
      refetch();
    } else {
      toast.error('Failed to update automation');
    }
  }, [rules, toggleAutomation, refetch]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="skeleton h-8 w-40" />
            <div className="skeleton h-4 w-64 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <p className="mt-4 text-sm text-rose-300 font-medium">Failed to load automations</p>
        <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        <button onClick={refetch} className="mt-4 px-4 h-10 rounded-xl glass text-sm hover:bg-white/10 transition">Try again</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Automation Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">Design no-code workflows that run across OmniFlow.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refetch} className="h-10 px-4 rounded-xl glass hover:bg-white/10 text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={() => toast.success('Use the builder below to create your workflow')} className="h-10 px-4 rounded-xl grad-primary text-white text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New workflow
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard><div className="text-xs text-muted-foreground">Active rules</div><div className="text-3xl font-bold mt-2 font-display">{rules.filter((rule) => rule.active).length}</div></GlassCard>
        <GlassCard><div className="text-xs text-muted-foreground">Fired this month</div><div className="text-3xl font-bold mt-2 font-display">{rules.reduce((total, rule) => total + rule.fired, 0).toLocaleString()}</div></GlassCard>
        <GlassCard><div className="text-xs text-muted-foreground">Hours saved</div><div className="text-3xl font-bold mt-2 font-display">418h</div></GlassCard>
      </div>

      {rules.length === 0 ? (
        <EmptyState
          icon={<Rocket className="w-6 h-6" />}
          title="No automations yet"
          description="Create your first automation to start working 24/7 across every channel."
          action={
            <button onClick={() => toast.success('Use the builder below to create your first workflow')} className="h-10 px-4 rounded-xl grad-primary text-white text-sm font-semibold">
              <Plus className="w-4 h-4 inline mr-1" /> Create automation
            </button>
          }
        />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rules.map((rule, index) => (
          <motion.div
            key={rule.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="glass rounded-2xl p-5 group hover:bg-white/5 transition"
          >
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl grid place-items-center ${rule.active ? 'grad-primary' : 'glass-strong'}`}>
                <Bot className={`w-5 h-5 ${rule.active ? 'text-white' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{rule.name}</h3>
                  {rule.channel !== 'all' ? (
                    <Badge>{channelMeta[rule.channel].label}</Badge>
                  ) : (
                    <Badge tone="primary">All channels</Badge>
                  )}
                  <Badge tone={rule.active ? 'success' : 'default'}>{rule.active ? 'Active' : 'Paused'}</Badge>
                </div>
                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="flex gap-2"><span className="text-muted-foreground text-xs uppercase tracking-widest w-16 mt-0.5">When</span><span>{rule.trigger}</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground text-xs uppercase tracking-widest w-16 mt-0.5">Then</span><span>{rule.action}</span></div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-accent" /> Fired {rule.fired.toLocaleString()} times
                  </div>
                  <button onClick={() => toggle(rule.id)} className={`relative w-11 h-6 rounded-full transition ${rule.active ? 'grad-primary' : 'bg-white/10'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition ${rule.active ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      )}

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-accent" />
            <span className="text-xs font-medium">Automation Performance</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold">{(rules.reduce((t, r) => t + r.fired, 0)).toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground">Total actions fired</div>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-400/40" />
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-xs text-muted-foreground">Response Time Saved</div>
          <div className="text-2xl font-bold mt-1">~4.2h</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">↑ 34% this week</div>
        </GlassCard>
        <GlassCard>
          <div className="text-xs text-muted-foreground">Conversion Lift</div>
          <div className="text-2xl font-bold mt-1">+18%</div>
          <div className="text-[10px] text-accent mt-0.5">Automation-assisted conversions</div>
        </GlassCard>
      </div>

      {/* Workflow Builder */}
      <GlassCard>
        <WorkflowBuilder />
      </GlassCard>

      {/* Follow-Up Rules */}
<GlassCard>
  <div className="flex items-center gap-2 mb-4">
    <Mail className="w-4 h-4 text-accent" />
    <h3 className="font-semibold">AI Follow-up Automation</h3>
    <Badge tone="info">Smart scheduling</Badge>
  </div>

  <div className="space-y-3">
    {followUpRules.map((rule) => (
      <div
        key={rule.id}
        className="rounded-xl border border-white/10 bg-white/5 p-4"
      >
        <div className="font-medium">
          {rule.name}
        </div>

        <div className="text-sm text-muted-foreground mt-1">
          Trigger: {rule.trigger}
        </div>

        <div className="mt-2">
          <Badge tone="success">Active</Badge>
        </div>
      </div>
    ))}
  </div>
</GlassCard>
    </div>
  );
}

