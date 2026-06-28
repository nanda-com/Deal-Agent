// src/hooks/useAi.ts — updated to capture cascadeStats from every AI response
import { useCallback, useState } from 'react';
import api from '@/lib/api';
import type { LeadPriority, Message } from '@/types';

export interface CascadeStats {
  run_id: string;
  cost: number;
  budget_max: number;
  budget_remaining: number;
  latency_ms: number;
  step_count: number;
  last_action: 'allow' | 'block';
}

// ─── AI Reply ──────────────────────────────────────────────────────────────

interface AiReplyResult {
  reply: string;
  confidence: number;
  intent?: string;
  sentiment?: string;
}

export function useGenerateAiReply() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiReplyResult | null>(null);
  const [cascadeStats, setCascadeStats] = useState<CascadeStats | null>(null);

  const generate = useCallback(async (
    conversationId: string,
    messageHistory: { role: string; text: string }[],
    persona?: string,
  ): Promise<(AiReplyResult & { cascadeStats?: CascadeStats }) | null> => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCascadeStats(null);
    try {
      const response = await api.post<AiReplyResult & { cascadeStats?: CascadeStats }>('/ai/reply', {
        conversationId,
        messageHistory,
        persona,
      });
      if (response.cascadeStats) setCascadeStats(response.cascadeStats);
      setLoading(false);
      setResult(response);
      return response;
    } catch (err: unknown) {
      const axiosErr = err as any;
      const stats: CascadeStats | undefined = axiosErr?.response?.data?.cascadeStats;
      if (stats) setCascadeStats(stats);
      const message = axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to generate AI reply';
      setError(message);
      setLoading(false);
      // Return cascadeStats even on failure so the caller can show the toast
      return { reply: '', confidence: 0, cascadeStats: stats } as any;
    }
  }, []);

  return { generate, loading, error, result, cascadeStats };
}

// ─── Lead Scoring ──────────────────────────────────────────────────────────

interface LeadScoreResult {
  score: number;
  priority: LeadPriority;
  summary: string;
  suggestedAction: string;
}

export function useAiLeadScore() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LeadScoreResult | null>(null);
  const [cascadeStats, setCascadeStats] = useState<CascadeStats | null>(null);

  const score = useCallback(async (
    leadId: string,
    conversationHistory: { role: string; text: string }[],
  ): Promise<LeadScoreResult | null> => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCascadeStats(null);
    try {
      const response = await api.post<LeadScoreResult & { cascadeStats?: CascadeStats }>('/ai/score-lead', {
        leadId,
        conversationHistory,
      });
      if (response.cascadeStats) setCascadeStats(response.cascadeStats);
      setLoading(false);
      setResult(response);
      return response;
    } catch (err: unknown) {
      const axiosErr = err as any;
      if (axiosErr?.response?.data?.cascadeStats) setCascadeStats(axiosErr.response.data.cascadeStats);
      const message = axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to score lead';
      setError(message);
      setLoading(false);
      return null;
    }
  }, []);

  return { score, loading, error, result, cascadeStats };
}

// ─── Conversation Summary ──────────────────────────────────────────────────

export function useAiSummary() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const generate = useCallback(async (conversationId: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const response = await api.post<{ summary: string }>('/ai/conversation-summary', {
        conversationId,
      });
      setLoading(false);
      setSummary(response.summary);
      return response.summary;
    } catch (err: unknown) {
      const axiosErr = err as any;
      const message = axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to generate summary';
      setError(message);
      setLoading(false);
      return null;
    }
  }, []);

  return { generate, loading, error, summary };
}

// ─── Suggested Responses ───────────────────────────────────────────────────

export function useSuggestedResponses() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [cascadeStats, setCascadeStats] = useState<CascadeStats | null>(null);

  const generate = useCallback(async (
    conversationId: string,
    messageHistory?: { role: string; text: string }[],
    count?: number,
  ): Promise<{ suggestions: string[]; cascadeStats: CascadeStats | null }> => {
    setLoading(true);
    setError(null);
    setCascadeStats(null);
    try {
      const response = await api.post<{ suggestions: string[]; cascadeStats?: CascadeStats }>('/ai/suggested-responses', {
        conversationId,
        messageHistory,
        count,
      });
      const stats = response.cascadeStats ?? null;
      if (stats) setCascadeStats(stats);
      const list = response.suggestions ?? [];
      setSuggestions(list);
      setLoading(false);
      return { suggestions: list, cascadeStats: stats };
    } catch (err: unknown) {
      const axiosErr = err as any;
      const stats = axiosErr?.response?.data?.cascadeStats ?? null;
      if (stats) setCascadeStats(stats);
      const message = axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to generate suggestions';
      setError(message);
      setLoading(false);
      return { suggestions: [], cascadeStats: stats };
    }
  }, []);

  return { generate, loading, error, suggestions, cascadeStats };
}

// ─── Combined Sentiment & Intent Analysis ──────────────────────────────────

interface AiReplyResult2 {
  reply: string;
  confidence: number;
  intent?: string;
  sentiment?: string;
}

export function useSentimentAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{
    intent: string;
    sentiment: string;
    confidence: number;
  } | null>(null);

  const analyze = useCallback(async (messages: Message[]): Promise<void> => {
    if (messages.length === 0) return;
    setLoading(true);
    setError(null);

    const messageHistory = messages.map((m) => ({ role: m.from, text: m.text }));

    try {
      const response = await api.post<AiReplyResult2>('/ai/reply', {
        conversationId: messages[0].conversationId,
        messageHistory,
      });
      setAnalysis({
        intent: response.intent || 'other',
        sentiment: response.sentiment || 'neutral',
        confidence: response.confidence,
      });
      setLoading(false);
    } catch (err: unknown) {
      const axiosErr = err as any;
      const message = axiosErr?.response?.data?.error || axiosErr?.message || 'Analysis failed';
      setError(message);
      setLoading(false);
    }
  }, []);

  return { analyze, loading, error, analysis };
}

// ─── Campaign Message Generator ────────────────────────────────────────────

export function useGenerateCampaignMessage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (params: {
      campaignName: string;
      campaignType: string;
      audienceDescription: string;
    }): Promise<string | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post<{ message: string }>('/ai/campaign-message', params);
        setLoading(false);
        return response.message;
      } catch (err: unknown) {
        const axiosErr = err as any;
        const message =
          axiosErr?.response?.data?.error ||
          axiosErr?.message ||
          'Failed to generate campaign message';
        setError(message);
        setLoading(false);
        return null;
      }
    },
    [],
  );

  return { generate, loading, error };
}
