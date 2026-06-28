import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { useFetch } from '@/hooks/useApi';
import type { CallLog } from '@/types';

export function useCallLogs() {
  return useFetch<CallLog[]>('/voice', []);
}

export function useMakeOutboundCall() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callSid, setCallSid] = useState<string | null>(null);

  const call = useCallback(async (to: string, voiceProfileId?: string) => {
    setLoading(true);
    setError(null);
    setCallSid(null);
    try {
      const result = await api.post<{ callSid: string }>('/voice/call', { to, voiceProfileId });
      setCallSid(result.callSid);
      return result;
    } catch (err: unknown) {
      const axiosErr = err as any;
      const message = axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to initiate call';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { call, loading, error, callSid };
}

export function useSaveCallLog() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (data: {
    callerName?: string;
    callerNumber?: string;
    duration?: number;
    outcome?: string;
    recordingUrl?: string;
    transcript?: string;
    aiSummary?: string;
    leadId?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<CallLog>('/voice/log', data);
      return result;
    } catch (err: unknown) {
      const axiosErr = err as any;
      const message = axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to save call log';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { save, loading, error };
}
