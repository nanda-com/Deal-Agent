import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessagesSquare,
  TrendingUp,
  Users,
  Sparkles,
  ArrowUpRight,
  Bot,
  PhoneCall,
  Zap,
  RefreshCw,
  AlertCircle,
  DollarSign,
  Target,
  BarChart3,
  Calendar,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Skeleton, SkeletonCard } from '@/components/ui-kit/Skeleton';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { GlassCard, Badge } from '@/components/ui-kit/Card';
import { useAnalytics, useAnalyticsInsights } from '@/hooks/useDashboard';
import { useAppointmentsContext } from '@/contexts/AppointmentsContext';
import { useLeadsContext } from '@/contexts/LeadsContext';
import { CalendarView } from '@/components/scheduling/CalendarView';
import { TopRecommendationsWidget } from '@/components/crm/TopRecommendationsWidget';
import { channelShare as fallbackChannelShare, leadFunnel, revenueForecast, agentPerformance } from '@/lib/mockData';

export function DashboardPage() {
  const { data: analytics, loading, error, refetch } = useAnalytics();
  const { data: insightsData } = useAnalyticsInsights();
  const { appointments } = useAppointmentsContext();
  const { syncStatus, lastSyncAt, totalSyncedRows, syncHistory } = useLeadsContext();

  const [workflowMetrics, setWorkflowMetrics] = useState({ count: 0, active: 0, successRate: 0 });

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('omniworkflows.data') : null;
    const workflows = raw ? (JSON.parse(raw) as { active: boolean; successRate: number }[]) : [];
    const total = workflows.length;
    const active = workflows.filter((item) => item.active).length;
    const avgRate = total > 0 ? Math.round(workflows.reduce((sum, item) => sum + (item.successRate ?? 0), 0) / total) : 0;
    setWorkflowMetrics({ count: total, active, successRate: avgRate });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 glass rounded-2xl p-5">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="glass rounded-2xl p-5">
            <Skeleton className="h-5 w-40 mb-4" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isColdStart = error === 'Network Error' || error.includes('timeout');
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-32">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <p className="mt-4 text-sm text-rose-300 font-medium">Failed to load dashboard</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          {isColdStart && (
            <p className="mt-2 text-xs text-muted-foreground/70 max-w-sm text-center">
              The backend server may be waking up from a cold start. This usually takes 30–60 seconds on the first request.
            </p>
          )}
          <button onClick={refetch} className="mt-4 px-4 h-10 rounded-xl glass text-sm hover:bg-white/10 transition">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const messageVolumeData = analytics?.messageVolume ?? [];
  const channelShareData = analytics?.channelShare ?? fallbackChannelShare;
  const channelTotal = channelShareData.reduce((sum, item) => sum + item.value, 0);
  const aiActivityData = analytics?.aiActivity ?? [];
  const insights = insightsData?.insights ?? [
    '73% leads responded automatically',
    'Peak customer activity detected at 7 PM',
    'Instagram conversions increased by 24%',
    'AI reduced response time by 81%',
    'WhatsApp engagement improved this week',
  ];

  const syncSuccessCount = syncHistory.filter((entry) => entry.status === 'success').length;
  const syncRate = syncHistory.length > 0 ? Math.round((syncSuccessCount / syncHistory.length) * 100) : 0;

  const metrics = [
    {
      label: 'Total Conversations',
      value: (analytics?.totalConversations ?? 12847).toLocaleString(),
      delta: '+18.2%',
      icon: MessagesSquare,
      tone: 'from-violet-500/30 to-fuchsia-500/10',
    },
    {
      label: 'AI Replies Sent',
      value: (analytics?.aiHandledCount ?? 9432).toLocaleString(),
      delta: '+24.7%',
      icon: Bot,
      tone: 'from-cyan-500/30 to-sky-500/10',
    },
    {
      label: 'Active Leads',
      value: (analytics?.totalLeads ?? 1284).toLocaleString(),
      delta: '+11.4%',
      icon: Users,
      tone: 'from-emerald-500/30 to-teal-500/10',
    },
    {
      label: 'Conversion Rate',
      value: (analytics?.conversionRate ?? 32.6) + '%',
      delta: '+4.1%',
      icon: TrendingUp,
      tone: 'from-amber-500/30 to-rose-500/10',
    },
  ];

  return (

    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">

        <div>

          <div className="flex items-center gap-2 text-xs text-accent uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            Live workspace
          </div>

          <h1 className="text-3xl font-bold mt-1">
            Welcome back, Alex
          </h1>

          <p className="text-sm text-muted-foreground mt-1">
            Your AI handled 412 conversations in the last 24 hours.
          </p>

        </div>

        <div className="flex gap-2">

          <button onClick={refetch} className="px-4 h-10 inline-flex items-center gap-2 rounded-xl glass text-sm font-medium hover:bg-white/10 transition">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link to="/inbox" className="px-4 h-10 inline-flex items-center gap-2 rounded-xl glass text-sm font-medium hover:bg-white/10 transition">
            Open inbox <ArrowUpRight className="w-4 h-4" />
          </Link>
          <Link to="/automations" className="px-4 h-10 inline-flex items-center gap-2 rounded-xl grad-primary text-sm font-semibold text-white hover:opacity-95 transition">
            <Zap className="w-4 h-4" /> New automation
          </Link>

        </div>

      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {metrics.map((metric, index) => {

          const Icon = metric.icon;

          return (

            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative glass rounded-2xl p-5 overflow-hidden"
            >

              <div
                className={`absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br ${metric.tone} blur-2xl`}
              />

              <div className="relative flex items-start justify-between">

                <div>

                  <div className="text-xs text-muted-foreground">
                    {metric.label}
                  </div>

                  <div className="text-3xl font-bold mt-2 font-display">
                    {metric.value}
                  </div>

                  <div className="text-xs text-emerald-300 mt-1">
                    {metric.delta} vs last week
                  </div>

                </div>

                <div className="w-10 h-10 rounded-xl glass-strong grid place-items-center">
                  <Icon className="w-4.5 h-4.5 text-foreground" />
                </div>

              </div>

            </motion.div>

          );
        })}

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <GlassCard className="xl:col-span-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Google Sheets Sync</div>
              <h3 className="text-xl font-semibold mt-1">Lead export overview</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Status</span>
              <span className={`px-3 py-1 rounded-full text-xs ${syncStatus === 'synced' ? 'bg-emerald-500/15 text-emerald-200' : syncStatus === 'syncing' ? 'bg-sky-500/15 text-sky-200' : syncStatus === 'failed' ? 'bg-rose-500/15 text-rose-200' : 'bg-white/10 text-muted-foreground'}`}>
                {syncStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
            <div className="rounded-2xl glass p-4">
              <div className="text-[11px] uppercase text-muted-foreground tracking-[0.24em] mb-2">Last sync</div>
              <div className="text-base font-semibold">{lastSyncAt ?? 'Never'}</div>
            </div>
            <div className="rounded-2xl glass p-4">
              <div className="text-[11px] uppercase text-muted-foreground tracking-[0.24em] mb-2">Total rows</div>
              <div className="text-base font-semibold">{totalSyncedRows.toLocaleString()}</div>
            </div>
            <div className="rounded-2xl glass p-4">
              <div className="text-[11px] uppercase text-muted-foreground tracking-[0.24em] mb-2">Success rate</div>
              <div className="text-base font-semibold">{syncHistory.length > 0 ? `${syncRate}%` : '—'}</div>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-muted-foreground">Automation Builder</div>
              <h3 className="text-xl font-semibold mt-1">Workflow health</h3>
            </div>
            <Zap className="w-5 h-5 text-sky-400" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl glass p-4">
              <div className="text-[11px] uppercase text-muted-foreground tracking-[0.24em] mb-2">Saved flows</div>
              <div className="text-2xl font-semibold">{workflowMetrics.count}</div>
            </div>
            <div className="rounded-2xl glass p-4">
              <div className="text-[11px] uppercase text-muted-foreground tracking-[0.24em] mb-2">Active</div>
              <div className="text-2xl font-semibold">{workflowMetrics.active}</div>
            </div>
            <div className="rounded-2xl glass p-4">
              <div className="text-[11px] uppercase text-muted-foreground tracking-[0.24em] mb-2">Avg success</div>
              <div className="text-2xl font-semibold">{workflowMetrics.successRate}%</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        <GlassCard className="xl:col-span-2">

          <div className="flex items-center justify-between mb-4">

            <div>
              <h3 className="font-semibold">
                Message volume
              </h3>

              <p className="text-xs text-muted-foreground">
                Last 7 days · across all channels
              </p>
            </div>

            <Badge tone="primary">
              Realtime
            </Badge>

          </div>

          <div className="h-64">

            <ResponsiveContainer>

              <AreaChart data={messageVolumeData}>

                <defs>

                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.19 295)" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="oklch(0.72 0.19 295)" stopOpacity={0} />
                  </linearGradient>

                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.74 0.18 195)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.74 0.18 195)" stopOpacity={0} />
                  </linearGradient>

                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(1 0 0 / 0.06)"
                />

                <XAxis
                  dataKey="day"
                  stroke="oklch(0.7 0.03 270)"
                  fontSize={12}
                />

                <YAxis
                  stroke="oklch(0.7 0.03 270)"
                  fontSize={12}
                />

                <Tooltip
                  contentStyle={{
                    background: 'oklch(0.21 0.03 270)',
                    border: '1px solid oklch(1 0 0 / 0.1)',
                    borderRadius: 12,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="whatsapp"
                  stroke="oklch(0.72 0.19 295)"
                  fill="url(#g1)"
                  strokeWidth={2}
                />

                <Area
                  type="monotone"
                  dataKey="instagram"
                  stroke="oklch(0.74 0.18 195)"
                  fill="url(#g2)"
                  strokeWidth={2}
                />

                <Area
                  type="monotone"
                  dataKey="web"
                  stroke="oklch(0.78 0.17 50)"
                  fill="transparent"
                  strokeWidth={2}
                />

              </AreaChart>

            </ResponsiveContainer>

          </div>

        </GlassCard>

        {/* Channel Performance */}
        <GlassCard>

          <div className="mb-4">

            <h3 className="font-semibold">
              Channel performance
            </h3>

            <p className="text-xs text-muted-foreground">
              Share of conversations
            </p>

          </div>

          <div className="h-48">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={channelShareData}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {channelShareData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    `${value} (${((value / channelTotal) * 100).toFixed(1)}%)`,
                    'Conversations',
                  ]}
                  contentStyle={{
                    background: 'oklch(0.21 0.03 270)',
                    border: '1px solid oklch(1 0 0 / 0.1)',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Channel Legend */}
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
            {channelShareData.map((entry) => {
              const pct = ((entry.value / channelTotal) * 100).toFixed(1);
              return (
                <div key={entry.name} className="flex items-center gap-2.5 text-sm">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-foreground/80">{entry.name}</span>
                  <span className="ml-auto font-semibold text-foreground">{pct}%</span>
                </div>
              );
            })}
          </div>

        </GlassCard>

      </div>

      {/* AI Voice */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        <GlassCard className="xl:col-span-2">

          <div className="flex items-center justify-between mb-4">

            <h3 className="font-semibold">
              AI response activity
            </h3>

            <Badge tone="success">
              +24% today
            </Badge>

          </div>

          <div className="h-48">

            <ResponsiveContainer>

              <BarChart data={aiActivityData}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(1 0 0 / 0.06)"
                />

                <XAxis
                  dataKey="hour"
                  stroke="oklch(0.7 0.03 270)"
                  fontSize={10}
                />

                <YAxis
                  stroke="oklch(0.7 0.03 270)"
                  fontSize={10}
                />

                <Tooltip />

                <Bar
                  dataKey="replies"
                  fill="oklch(0.72 0.19 295)"
                  radius={[6, 6, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </GlassCard>

        <GlassCard>

          <div className="flex items-center justify-between mb-4">

            <h3 className="font-semibold">
              AI Voice Assistant
            </h3>

            <Badge tone="info">
              Live
            </Badge>

          </div>

          <div className="rounded-xl p-4 grad-primary text-white relative overflow-hidden">

            <PhoneCall className="absolute -right-2 -bottom-2 w-24 h-24 opacity-20" />

            <div className="text-xs uppercase tracking-widest opacity-80">
              Today
            </div>

            <div className="text-4xl font-bold font-display mt-1">
              38
            </div>

            <div className="text-sm opacity-90">
              calls handled · avg 2m 14s
            </div>

          </div>

        </GlassCard>

      </div>

      {/* Revenue Forecast + Lead Funnel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        <GlassCard className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Revenue Forecast</h3>
              <p className="text-xs text-muted-foreground">Actual vs projected monthly revenue</p>
            </div>
            <Badge tone="primary">
              <DollarSign className="w-3 h-3 inline mr-1" />
              ${(revenueForecast.filter(r => r.actual !== null).reduce((s, r) => s + (r.actual ?? 0), 0)).toLocaleString()}
            </Badge>
          </div>
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={revenueForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="month" stroke="oklch(0.7 0.03 270)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.03 270)" fontSize={10} />
                <Tooltip contentStyle={{ background: 'oklch(0.21 0.03 270)', border: '1px solid oklch(1 0 0 / 0.1)', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="actual" fill="oklch(0.72 0.19 295)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="forecast" fill="oklch(0.74 0.18 195)" radius={[6, 6, 0, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Actual</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent/60" /> Forecast</span>
            <span className="ml-auto font-medium text-emerald-400">↑ {((revenueForecast.find(r => r.month === 'May')?.actual ?? 0) / (revenueForecast.find(r => r.month === 'Jan')?.actual ?? 1) * 100 - 100).toFixed(0)}% growth</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-accent" />
            <h3 className="font-semibold">Lead Funnel</h3>
          </div>
          <div className="space-y-2.5">
            {leadFunnel.map((stage) => {
              const maxCount = leadFunnel[0].count;
              const pct = Math.round((stage.count / maxCount) * 100);
              const colors = ['bg-emerald-400', 'bg-accent', 'bg-amber-400', 'bg-rose-400', 'bg-violet-400', 'bg-cyan-400'];
              return (
                <div key={stage.stage} className="flex items-center gap-3">
                  <span className="text-xs w-24 shrink-0 text-muted-foreground">{stage.stage}</span>
                  <div className="flex-1 h-4 rounded-full bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full ${colors[leadFunnel.indexOf(stage)]} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-semibold w-16 text-right shrink-0">{stage.count}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 glass rounded-xl p-3 text-center">
            <div className="text-xs text-muted-foreground">Conversion Rate</div>
            <div className="text-2xl font-bold text-emerald-400">{Math.round((leadFunnel[leadFunnel.length - 1].count / leadFunnel[0].count) * 100)}%</div>
          </div>
        </GlassCard>

      </div>

      {/* Campaign + Agent Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        <GlassCard className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-accent" />
              <h3 className="font-semibold">Agent Performance</h3>
            </div>
            <Badge tone="success">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              {(agentPerformance.reduce((s, a) => s + a.resolved, 0)).toLocaleString()} resolved
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground uppercase tracking-wider">
                  <th className="text-left py-2 pr-3">Agent</th>
                  <th className="text-right py-2 px-3">Conversations</th>
                  <th className="text-right py-2 px-3">Resolved</th>
                  <th className="text-right py-2 px-3">Satisfaction</th>
                  <th className="text-right py-2 pl-3">Avg Time</th>
                </tr>
              </thead>
              <tbody>
                {agentPerformance.map((agent, i) => (
                  <tr key={agent.name} className="border-t border-white/5 hover:bg-white/3 transition">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full grad-primary grid place-items-center text-[8px] font-bold text-white">
                          {agent.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium">{agent.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-2.5 px-3 font-medium">{agent.conversations}</td>
                    <td className="text-right py-2.5 px-3 font-medium text-emerald-400">{agent.resolved}</td>
                    <td className="text-right py-2.5 px-3">
                      <div className="flex items-center justify-end gap-1">
                        <span className="font-medium">{agent.satisfaction}</span>
                        <span className="text-amber-400">★</span>
                      </div>
                    </td>
                    <td className="text-right py-2.5 pl-3 text-muted-foreground">{agent.avgTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-accent" />
            <h3 className="font-semibold">Appointments</h3>
            <Badge tone="info">{appointments.filter(a => a.status === 'scheduled').length} today</Badge>
          </div>
          <div className="space-y-2">
            {appointments.filter(a => a.date === 'Today' && (a.status === 'scheduled' || a.status === 'completed')).slice(0, 4).map((appt) => (
              <div key={appt.id} className="flex items-center gap-3 glass rounded-lg p-2.5">
                <div className="w-8 h-8 rounded-lg grad-primary grid place-items-center text-xs font-bold text-white">
                  {appt.leadName.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{appt.leadName}</div>
                  <div className="text-[10px] text-muted-foreground">{appt.leadCompany}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-semibold">{appt.time}</div>
                  <Badge tone={appt.status === 'completed' ? 'success' : 'info'} className="text-[8px]">{appt.status}</Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {appointments.filter(a => a.status === 'scheduled').length} upcoming
            </div>
            <div className="text-xs font-semibold text-emerald-400">
              {appointments.filter(a => a.status === 'completed').length} completed
            </div>
          </div>
        </GlassCard>

      </div>

      {/* Top AI Recommendations */}
      <TopRecommendationsWidget />

      {/* Full Calendar View */}
      <CalendarView />

      {/* AI Insights */}
      <GlassCard>

        <div className="flex items-center justify-between mb-4">

          <h3 className="font-semibold">
            🤖 AI Insights
          </h3>

          <Badge tone="primary">
            Smart Analytics
          </Badge>

        </div>

        <div className="space-y-4 text-sm text-muted-foreground">
          {insights.map((insight, index) => (
            <div key={index} className="glass rounded-xl p-4">• {insight}</div>
          ))}
        </div>

      </GlassCard>

    </div>

  );
}