import { useCallback, useState } from 'react';
import { useFetch } from './useApi';
import api from '@/lib/api';
import type { Automation, CreateAutomationInput } from '@/types';

export function useAutomations() {
  return useFetch<Automation[]>('/automations');
}

export function useToggleAutomation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = useCallback(async (id: string, active: boolean): Promise<Automation | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.patch<Automation>('/automations/' + id, { active });
      setLoading(false);
      return result;
    } catch (err: unknown) {
      const axiosErr = err as any;
      const message = axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to toggle automation';
      setError(message);
      setLoading(false);
      return null;
    }
  }, []);

  return { toggle, loading, error };
}

export function useCreateAutomation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (input: CreateAutomationInput): Promise<Automation | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<Automation>('/automations', input);
      setLoading(false);
      return result;
    } catch (err: unknown) {
      const axiosErr = err as any;
      const message = axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to create automation';
      setError(message);
      setLoading(false);
      return null;
    }
  }, []);

  return { create, loading, error };
}
