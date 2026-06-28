import { useCallback, useState } from 'react';
import { useFetch } from './useApi';
import api from '@/lib/api';
import type { Lead, UpdateLeadInput } from '@/types';

export function useLeads(limit = 100, priority?: string, search?: string) {
  const params: Record<string, string> = { limit: String(limit) };
  if (priority && priority !== 'all') params.priority = priority;
  if (search) params.search = search;
  const url = '/leads?' + new URLSearchParams(params).toString();
  return useFetch<Lead[]>(url, [limit, priority, search]);
}

export function useLead(id: string | null) {
  return useFetch<Lead>(id ? '/leads/' + id : null, [id]);
}

export function useUpdateLead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, input: UpdateLeadInput): Promise<Lead | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.patch<Lead>('/leads/' + id, input);
      setLoading(false);
      return result;
    } catch (err: unknown) {
      const axiosErr = err as any;
      const message = axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to update lead';
      setError(message);
      setLoading(false);
      return null;
    }
  }, []);

  return { update, loading, error };
}

export function useDeleteLead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await api.del('/leads/' + id);
      setLoading(false);
      return true;
    } catch (err: unknown) {
      const axiosErr = err as any;
      const message = axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to delete lead';
      setError(message);
      setLoading(false);
      return false;
    }
  }, []);

  return { remove, loading, error };
}
