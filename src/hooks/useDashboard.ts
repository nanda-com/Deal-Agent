import { useFetch } from './useApi';
import type { AnalyticsData } from '@/types';

export function useAnalytics() {
  return useFetch<AnalyticsData>('/analytics');
}

export function useAnalyticsInsights() {
  return useFetch<{ insights: string[] }>('/analytics/insights');
}
