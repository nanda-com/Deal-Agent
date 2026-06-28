import { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { GlassCard, Badge } from '@/components/ui-kit/Card';
import { SkeletonCard } from '@/components/ui-kit/Skeleton';
import { ChannelShareChart } from '@/components/analytics/ChannelShareChart';
import { CrmAnalyticsWidget } from '@/components/crm/TopRecommendationsWidget';
import { messageVolume, leadGrowth, channelShare as fallbackChannelShare, aiActivity } from '@/lib/mockData';
import { useAnalytics } from '@/hooks/useDashboard';
import { RefreshCw } from 'lucide-react';

const tooltipStyle = {
  background: 'oklch(0.21 0.03 270)',
  border: '1px solid oklch(1 0 0 / 0.1)',
  borderRadius: 12,
  fontSize: 12,
};

const kpis = [
  { label: 'Avg response time', value: '8s', delta: '−42%', tone: 'success' as const },
  { label: 'CSAT score', value: '4.8 / 5', delta: '+0.3', tone: 'success' as const },
  { label: 'AI deflection', value: '73.4%', delta: '+9.1%', tone: 'primary' as const },
  { label: 'Cost per lead', value: '$1.24', delta: '−18%', tone: 'success' as const },
];

export function AnalyticsPage() {
  const { data: analytics, loading: analyticsLoading } = useAnalytics();
  const [loading] = useState(false);

  const channelShareData = analytics?.channelShare ?? fallbackChannelShare;
  const messageVolumeData = analytics?.messageVolume ?? messageVolume;

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5">
              <div className="skeleton h-5 w-40 mb-4" />
              <div className="skeleton h-72 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time performance across all channels · auto-refresh on</p>
        </div>
        <Badge tone="success">Live · updated 12s ago</Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <GlassCard key={kpi.label}>
            <div className="text-xs text-muted-foreground">{kpi.label}</div>
            <div className="text-3xl font-bold font-display mt-2">{kpi.value}</div>
            <Badge tone={kpi.tone} className="mt-2">{kpi.delta}</Badge>
          </GlassCard>
        ))}
      </div>

      <div>
        <h3 className="font-semibold mb-3">Smart CRM Recommendations</h3>
        <CrmAnalyticsWidget />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GlassCard>
          <h3 className="font-semibold mb-1">Message volume by channel</h3>
          <p className="text-xs text-muted-foreground mb-4">Last 7 days</p>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={messageVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="day" stroke="oklch(0.7 0.03 270)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.03 270)" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="whatsapp" stackId="1" stroke="oklch(0.74 0.18 155)" fill="oklch(0.74 0.18 155 / 0.4)" />
                <Area type="monotone" dataKey="instagram" stackId="1" stroke="oklch(0.7 0.2 340)" fill="oklch(0.7 0.2 340 / 0.4)" />
                <Area type="monotone" dataKey="web" stackId="1" stroke="oklch(0.74 0.18 195)" fill="oklch(0.74 0.18 195 / 0.4)" />
                <Area type="monotone" dataKey="linkedin" stackId="1" stroke="oklch(0.74 0.18 230)" fill="oklch(0.74 0.18 230 / 0.4)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-1">Lead growth & conversions</h3>
          <p className="text-xs text-muted-foreground mb-4">Last 6 weeks</p>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={leadGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="week" stroke="oklch(0.7 0.03 270)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.03 270)" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="leads" stroke="oklch(0.72 0.19 295)" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="converted" stroke="oklch(0.74 0.18 155)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-1">Channel share</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribution of conversations by channel</p>
          {analyticsLoading ? (
            <div className="space-y-4">
              <div className="skeleton h-24 w-full rounded-xl" />
              <div className="skeleton h-52 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-10 rounded-xl" />
                ))}
              </div>
            </div>
          ) : (
            <ChannelShareChart data={channelShareData} messageVolume={messageVolumeData} />
          )}
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-1">AI activity (24h)</h3>
          <p className="text-xs text-muted-foreground mb-4">Replies generated per hour</p>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={aiActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="hour" stroke="oklch(0.7 0.03 270)" fontSize={10} interval={2} />
                <YAxis stroke="oklch(0.7 0.03 270)" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="replies" fill="oklch(0.74 0.18 195)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
