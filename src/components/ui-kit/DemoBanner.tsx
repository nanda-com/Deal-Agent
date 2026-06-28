import { Zap } from 'lucide-react';

export function DemoBanner() {
  // Only show if we're in demo mode (no real API token)
  const isDemo = typeof window !== 'undefined' && !localStorage.getItem('omniflow_token');

  if (!isDemo) return null;

  return (
    <div className="demo-banner px-4 py-2 text-xs text-center flex items-center justify-center gap-2 text-accent font-medium">
      <Zap className="w-3.5 h-3.5" />
      Demo mode — data is simulated for the hackathon presentation.
      <span className="text-muted-foreground font-normal">
        Connect real services in Settings.
      </span>
    </div>
  );
}
