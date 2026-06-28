import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, DollarSign, Target, Zap, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui-kit/Card';
import { salesPredictions } from '@/lib/mockData';

export function SalesAssistantPanel() {
  const prediction = salesPredictions[0];

  return (
    <div className="space-y-4">
      {/* AI Sales Agent Header */}
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold">AI Sales Agent</h3>
      </div>

      {/* Current Prediction Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grad-primary rounded-2xl p-4 text-white relative overflow-hidden"
      >
        <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest opacity-80">AI Recommendation</span>
          </div>
          <p className="text-sm font-semibold mt-2">{prediction.recommendedPlan}</p>
          <div className="flex gap-4 mt-3">
            <div>
              <div className="text-[10px] opacity-70">Deal Size</div>
              <div className="text-lg font-bold">${(prediction.estimatedDealSize / 1000).toFixed(1)}k</div>
            </div>
            <div>
              <div className="text-[10px] opacity-70">Conversion Chance</div>
              <div className="flex items-center gap-1 text-lg font-bold">
                {prediction.conversionChance}%
                <TrendingUp className="w-4 h-4 text-emerald-300" />
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/20">
            <div className="flex items-center gap-2 text-xs">
              <Target className="w-3 h-3" />
              {prediction.suggestedAction}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Conversion Score Ring */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Conversion Probability</span>
          <Badge tone={prediction.score >= 80 ? 'success' : prediction.score >= 60 ? 'warning' : 'info'}>
            Score: {prediction.score}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="oklch(1 0 0 / 0.06)" strokeWidth="5" />
              <motion.circle
                cx="32" cy="32" r="26"
                fill="none"
                stroke="url(#convGrad)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${(prediction.score / 100) * 163} 163`}
                initial={{ strokeDasharray: '0 163' }}
                animate={{ strokeDasharray: `${(prediction.score / 100) * 163} 163` }}
                transition={{ duration: 1.5 }}
              />
              <defs>
                <linearGradient id="convGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-sm font-bold">{prediction.score}</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <DollarSign className="w-3 h-3 text-emerald-400" />
              <span className="text-muted-foreground">Est. Deal Size:</span>
              <span className="font-semibold">${prediction.estimatedDealSize.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Zap className="w-3 h-3 text-accent" />
              <span className="text-muted-foreground">Next Action:</span>
              <span className="font-semibold">{prediction.suggestedAction}</span>
            </div>
          </div>
        </div>

        {/* Suggested Response */}
        <div className="mt-3 glass rounded-xl p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Suggested Response</div>
          <p className="text-xs leading-relaxed">
            "Hi! Based on your team size, I recommend our Pro Plan at $49/user/month. Would you like a quick 15-min demo this Thursday at 3 PM to see it in action?"
          </p>
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="glass rounded-2xl p-4">
        <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Quick Plan Match</h4>
        <div className="space-y-2">
          {[
            { name: 'Starter', price: '$19', users: 'Up to 10', features: 'Basic AI, 2 channels' },
            { name: 'Pro', price: '$49', users: 'Up to 50', features: 'Full AI, all channels, voice' },
            { name: 'Enterprise', price: '$99', users: 'Unlimited', features: 'Custom AI, dedicated support' },
          ].map((plan) => (
            <div key={plan.name} className="flex items-center justify-between glass rounded-lg px-3 py-2">
              <div>
                <span className="text-sm font-medium">{plan.name}</span>
                <span className="text-[10px] text-muted-foreground ml-2">{plan.features}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold">{plan.price}</span>
                <span className="text-[10px] text-muted-foreground">/user/mo</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
