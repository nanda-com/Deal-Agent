import { useEffect, useState } from 'react';
import { formatRelativeTime } from '@/lib/notifications';

export function useRelativeTime(timestamp: number, intervalMs = 30_000): string {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [timestamp, intervalMs]);

  return formatRelativeTime(timestamp);
}
