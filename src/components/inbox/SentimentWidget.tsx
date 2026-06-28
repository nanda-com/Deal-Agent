import { motion } from 'framer-motion';
import { Smile, Frown, Meh, Sparkles, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { Badge } from '@/components/ui-kit/Card';
import { sentimentHistory } from '@/lib/mockData';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import type { SentimentResult } from '@/types';

const emotionEmojis: Record<string, string> = {
  happy: '😊',
  frustrated: '😤',
  neutral: '😐',
  interested: '🤔',
  urgent: '🔥',
};

const emotionColors: Record<string, string> = {
  happy: 'text-emerald-400',
  frustrated: 'text-rose-400',
  neutral: 'text-gray-400',
  interested: 'text-accent',
  urgent: 'text-amber-400',
};

export function SentimentWidget({
  analysis,
  compact = false,
}: {
  analysis?: SentimentResult | null;
  compact?: boolean;
}) {
  const data: SentimentResult = analysis ?? {
    label: 'positive',
    confidence: 87,
    emotion: 'interested',
    score: 0.72,
  };

  const Icon = data.label === 'positive' ? Smile : data.label === 'negative' ? Frown : Meh;
  const iconColor = data.label === 'positive' ? 'text-emerald-400' : data.label === 'negative' ? 'text-rose-400' : 'text-gray-400';
  const emoji = emotionEmojis[data.emotion] ?? '😐';

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium capitalize">{data.label}</span>
            <span className="text-[10px] text-muted-foreground">{data.confidence}%</span>
          </div>
          <div className="h-1 w-20 rounded-full bg-white/10 overflow-hidden">
            <div className={`h-full rounded-full ${data.label === 'positive' ? 'bg-emerald-400' : data.label === 'negative' ? 'bg-rose-400' : 'bg-gray-400'}`}
              style={{ width: `${data.confidence}%` }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold">AI Sentiment Analysis</h3>
      </div>

      {/* Current Sentiment */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div className="text-3xl">{emoji}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold capitalize ${iconColor}`}>{data.label}</span>
              {data.score > 0.5 ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : data.score < -0.3 ? (
                <TrendingDown className="w-4 h-4 text-rose-400" />
              ) : (
                <Minus className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground capitalize">emotion: {data.emotion}</span>
              <Badge tone={data.label === 'positive' ? 'success' : data.label === 'negative' ? 'danger' : 'info'}>
                {data.confidence}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Score Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Negative</span>
            <span className="font-medium text-foreground">Score: {(data.score * 100).toFixed(0)}</span>
            <span>Positive</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden relative">
            <motion.div
              initial={{ width: '50%', x: '0%' }}
              animate={{
                width: '8%',
                x: `${(data.score + 1) * 42}%`,
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${data.label === 'positive' ? 'bg-emerald-400' : data.label === 'negative' ? 'bg-rose-400' : 'bg-gray-400'}`}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
            <span>-1.0</span>
            <span>0</span>
            <span>+1.0</span>
          </div>
        </div>
      </div>

      {/* Sentiment Trend */}
      <div className="glass rounded-xl p-4">
        <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">7-Day Trend</h4>
        <div className="h-24">
          <ResponsiveContainer>
            <AreaChart data={sentimentHistory}>
              <defs>
                <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.74 0.18 155)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="oklch(0.74 0.18 155)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="oklch(0.7 0.03 270)" fontSize={9} />
              <YAxis stroke="oklch(0.7 0.03 270)" fontSize={9} />
              <Tooltip
                contentStyle={{
                  background: 'oklch(0.21 0.03 270)',
                  border: '1px solid oklch(1 0 0 / 0.1)',
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />
              <Area type="monotone" dataKey="positive" stroke="oklch(0.74 0.18 155)" fill="url(#posGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
