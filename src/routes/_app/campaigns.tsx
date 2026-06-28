import { motion } from 'framer-motion';
import { Megaphone, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui-kit/Card';
import { CampaignDashboard } from '@/components/campaigns/CampaignManager';

export function CampaignsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-accent uppercase tracking-widest mb-1">
            <Megaphone className="w-3.5 h-3.5" />
            WhatsApp Broadcast
          </div>
          <h1 className="text-3xl font-bold font-display">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered WhatsApp marketing with real lead targeting and analytics
          </p>
        </div>
        <Badge tone="primary" className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Gemini AI
        </Badge>
      </div>
      <CampaignDashboard />
    </motion.div>
  );
}
