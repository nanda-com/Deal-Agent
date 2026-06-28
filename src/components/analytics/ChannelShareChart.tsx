import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';
import type { ChannelShareEntry, MessageVolumeEntry } from '@/types';

const tooltipStyle = {
  background: 'oklch(0.21 0.03 270)',
  border: '1px solid oklch(1 0 0 / 0.1)',
  borderRadius: 12,
  fontSize: 12,
  padding: '10px 14px',
};

const CHANNEL_VOLUME_KEYS: Partial<Record<string, keyof MessageVolumeEntry>> = {
  WhatsApp: 'whatsapp',
  Instagram: 'instagram',
  'Web Chat': 'web',
  LinkedIn: 'linkedin',
};

interface EnrichedChannel extends ChannelShareEntry {
  percentage: number;
}

interface ChannelShareChartProps {
  data: ChannelShareEntry[];
  messageVolume?: MessageVolumeEntry[];
}

function computeWeekOverWeekDelta(
  channelName: string,
  messageVolume: MessageVolumeEntry[],
): number | null {
  const key = CHANNEL_VOLUME_KEYS[channelName];
  if (!key || messageVolume.length < 2) return null;

  const mid = Math.floor(messageVolume.length / 2);
  const earlier = messageVolume.slice(0, mid);
  const recent = messageVolume.slice(mid);

  const shareForPeriod = (days: MessageVolumeEntry[]) => {
    const channelTotal = days.reduce((sum, day) => sum + (Number(day[key]) || 0), 0);
    const allTotal = days.reduce(
      (sum, day) => sum + day.whatsapp + day.instagram + day.web + day.linkedin,
      0,
    );
    return allTotal > 0 ? (channelTotal / allTotal) * 100 : 0;
  };

  return shareForPeriod(recent) - shareForPeriod(earlier);
}

function ChannelShareTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: EnrichedChannel }>;
}) {
  if (!active || !payload?.length) return null;

  const entry = payload[0].payload;

  return (
    <div style={tooltipStyle} className="shadow-xl">
      <p className="font-semibold text-foreground mb-1">{entry.name}</p>
      <p className="text-muted-foreground">{entry.value} conversations</p>
      <p className="text-primary font-medium mt-0.5">{Math.round(entry.percentage)}% share</p>
    </div>
  );
}

export function ChannelShareChart({ data, messageVolume }: ChannelShareChartProps) {
  const { enriched, total, topChannel, weekDelta } = useMemo(() => {
    const totalConversations = data.reduce((sum, item) => sum + item.value, 0);

    const withPercentages: EnrichedChannel[] = data.map((item) => ({
      ...item,
      percentage: totalConversations > 0 ? (item.value / totalConversations) * 100 : 0,
    }));

    const top = withPercentages.reduce(
      (best, current) => (current.percentage > best.percentage ? current : best),
      withPercentages[0],
    );

    const delta =
      top && messageVolume?.length
        ? computeWeekOverWeekDelta(top.name, messageVolume)
        : null;

    return {
      enriched: withPercentages,
      total: totalConversations,
      topChannel: top,
      weekDelta: delta,
    };
  }, [data, messageVolume]);

  if (!enriched.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">No channel data available</p>
    );
  }

  const deltaRounded = weekDelta !== null ? Math.round(Math.abs(weekDelta)) : null;
  const deltaPositive = weekDelta !== null && weekDelta >= 0;

  return (
    <div className="space-y-4">
      {/* Most Active Channel KPI */}
      <div className="rounded-xl border border-white/8 bg-gradient-to-br from-violet-500/10 via-transparent to-fuchsia-500/5 p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Most Active Channel
        </p>
        <p className="mt-1 text-2xl font-bold font-display">{topChannel.name}</p>
        <p className="text-xl font-semibold text-primary mt-0.5 tabular-nums">
          {Math.round(topChannel.percentage)}%
        </p>
        {deltaRounded !== null && (
          <div
            className={`flex items-center gap-1 mt-2 text-xs font-medium ${
              deltaPositive ? 'text-emerald-300' : 'text-rose-300'
            }`}
          >
            {deltaPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span className="tabular-nums">
              {deltaPositive ? '↑' : '↓'} {deltaRounded}% vs last week
            </span>
          </div>
        )}
      </div>

      {/* Top channel badge */}
      <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 text-xs font-medium text-amber-200">
        <span aria-hidden>🏆</span>
        <span>
          Top Channel: {topChannel.name} ({Math.round(topChannel.percentage)}%)
        </span>
      </div>

      {/* Donut chart with center text */}
      <div className="relative h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={enriched}
              dataKey="value"
              nameKey="name"
              innerRadius={68}
              outerRadius={96}
              paddingAngle={3}
              stroke="transparent"
            >
              {enriched.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ChannelShareTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] text-muted-foreground font-medium">Total Conversations</span>
          <span className="text-2xl font-bold font-display tabular-nums mt-0.5">{total}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {enriched.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2.5"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white/10"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-foreground/85 flex-1 min-w-0 truncate">{entry.name}</span>
            <span className="text-sm font-medium tabular-nums text-foreground/70">{entry.value}</span>
            <span className="text-sm font-semibold tabular-nums text-foreground w-10 text-right">
              {Math.round(entry.percentage)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
