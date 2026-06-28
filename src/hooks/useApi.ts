import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFetch<T>(
  url: string | null,
  deps: unknown[] = []
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchId, setFetchId] = useState(0);

  const refetch = useCallback(() => {
    setFetchId((id) => id + 1);
  }, []);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError(null);

    api
      .get<T>(url)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const axiosErr = err as any;

          const message =
            axiosErr?.response?.data?.error ||
            axiosErr?.message ||
            'An unexpected error occurred';

          setError(message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url, fetchId, ...deps]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}