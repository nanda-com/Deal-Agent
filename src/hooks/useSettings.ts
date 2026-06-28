import { useCallback, useState } from 'react';
import { useFetch } from './useApi';
import api from '@/lib/api';
import type { WorkspaceSettings, UpdateSettingsInput } from '@/types';

export function useSettings() {
  return useFetch<WorkspaceSettings>('/settings');
}

export function useUpdateSettings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (input: UpdateSettingsInput): Promise<WorkspaceSettings | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.put<WorkspaceSettings>('/settings', input);
      setLoading(false);
      return result;
    } catch (err: unknown) {
      const axiosErr = err as any;
      const message = axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to update settings';
      setError(message);
      setLoading(false);
      return null;
    }
  }, []);

  return { update, loading, error };
}
