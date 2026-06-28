import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, TrendingUp, Activity, MessageSquare, Users, Star, Target } from 'lucide-react';
import { Badge } from '@/components/ui-kit/Card';
import type { LeadScoreBreakdown } from '@/types';
import { leadScoreBreakdowns } from '@/lib/mockData';

const factorIcons: Record<string, React.ReactNode> = {
  'Pricing Intent': <TrendingUp className="w-3.5 h-3.5" />,
  'Demo Requests': <Star className="w-3.5 h-3.5" />,
  'Team Size Fit': <Users className="w-3.5 h-3.5" />,
  'Positive Sentiment': <Activity className="w-3.5 h-3.5" />,
  'Response Frequency': <MessageSquare className="w-3.5 h-3.5" />,
  'Engagement Level': <Target className="w-3.5 h-3.5" />,
};

export function LeadScoringModal({
  leadId,
  open,
  onClose,
}: {
  leadId: string;
  open: boolean;
  onClose: () => void;
}) {
  const data: LeadScoreBreakdown = leadScoreBreakdowns[leadId] ?? {
    overall: 78,
    confidence: 85,
    temperature: 'warm' as const,
    factors: [
      { label: 'Pricing Intent', score: 70, maxScore: 100, weight: 30 },
      { label: 'Demo Requests', score: 65, maxScore: 100, weight: 25 },
      { label: 'Team Size Fit', score: 80, maxScore: 100, weight: 15 },
    ],
    summary: 'Promising lead with moderate engagement. Further nurturing recommended.',
    recommendedAction: 'Send follow-up materials and schedule call',
  };

  const tempColors: Record<string, string> = {
    hot: 'from-rose-500/30 to-rose-500/10 text-rose-300 border-rose-500/30',
    warm: 'from-amber-500/30 to-amber-500/10 text-amber-300 border-amber-500/30',
    cold: 'from-sky-500/30 to-sky-500/10 text-sky-300 border-sky-500/30',
  };

  const tempDots: Record<string, string> = {
    hot: 'bg-rose-400',
    warm: 'bg-amber-400',
    cold: 'bg-sky-400',
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-[#0f172a] text-white rounded-[16px] p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-bold">AI Lead Scoring</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score Circle */}
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="relative">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(1 0 0 / 0.06)" strokeWidth="8" />
                  <motion.circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="url(#scoreGrad)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(data.overall / 100) * 264} 264`}
                    initial={{ strokeDasharray: '0 264' }}
                    animate={{ strokeDasharray: `${(data.overall / 100) * 264} 264` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{data.overall}</div>
                    <div className="text-[10px] text-muted-foreground">Score</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className={`glass rounded-xl px-4 py-2.5 border ${tempColors[data.temperature]}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${tempDots[data.temperature]}`} />
                    <span className="text-sm font-semibold capitalize">{data.temperature}</span>
                  </div>
                  <div className="text-[10px] opacity-70 mt-0.5">Lead Temperature</div>
                </div>
                <div className="glass rounded-xl px-4 py-2.5">
                  <div className="text-sm font-semibold">{data.confidence}%</div>
                  <div className="text-[10px] text-muted-foreground">Confidence</div>
                </div>
              </div>
            </div>

            {/* Factors */}
            <div className="space-y-3 mb-5">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Scoring Factors</h3>
              {data.factors.map((factor) => (
                <div key={factor.label} className="glass rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-accent">{factorIcons[factor.label] ?? <Activity className="w-3.5 h-3.5" />}</span>
                      {factor.label}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{(factor.weight)}%</span>
                      <span className="text-sm font-semibold">{factor.score}/{factor.maxScore}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: `${(factor.score / factor.maxScore) * 100}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{
                        background: factor.score > 80
                          ? 'linear-gradient(135deg, #a855f7, #06b6d4)'
                          : factor.score > 60
                          ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                          : 'linear-gradient(135deg, #94a3b8, #64748b)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="glass rounded-xl p-4 mb-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{data.summary}</p>
            </div>

            {/* Recommended Action */}
            <div className="grad-primary rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest opacity-80">Recommended Action</span>
              </div>
              <p className="text-sm font-medium">{data.recommendedAction}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'text-xs px-1.5 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-1';
  const color = score >= 80 ? 'text-emerald-300 bg-emerald-400/15' : score >= 60 ? 'text-amber-300 bg-amber-400/15' : 'text-sky-300 bg-sky-400/15';
  return (
    <Badge className={`${s} ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${score >= 80 ? 'bg-emerald-400' : score >= 60 ? 'bg-amber-400' : 'bg-sky-400'}`} />
      Score: {score}
    </Badge>
  );
}
