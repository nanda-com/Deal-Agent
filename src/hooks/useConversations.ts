import { useState, useEffect, useCallback } from 'react';
import { useFetch } from './useApi';
import api from '@/lib/api';
import type { Conversation, Message, CreateConversationInput, SendMessageInput } from '@/types';

export function useConversations(limit = 50, channel?: string) {
  const params: Record<string, string> = { limit: String(limit) };
  if (channel && channel !== 'all') params.channel = channel;
  const url = '/conversations?' + new URLSearchParams(params).toString();
  return useFetch<Conversation[]>(url, [limit, channel]);
}

export function useConversation(id: string | null) {
  return useFetch<Conversation>(id ? '/conversations/' + id : null, [id]);
}

export function useMessages(conversationId: string | null, limit = 100) {
  const url = conversationId ? '/conversations/' + conversationId + '/messages' : null;
  const result = useFetch<Message[]>(url, [conversationId, limit]);
  return result;
}

export function useCreateConversation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (input: CreateConversationInput): Promise<Conversation | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<Conversation>('/conversations', input);
      setLoading(false);
      return result;
    } catch (err: unknown) {
      const axiosErr = err as any;
      const message = axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to create conversation';
      setError(message);
      setLoading(false);
      return null;
    }
  }, []);

  return { create, loading, error };
}

export function useSendMessage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (input: SendMessageInput): Promise<Message | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<Message>('/conversations/' + input.conversationId + '/messages', input);
      setLoading(false);
      return result;
    } catch (err: unknown) {
      const axiosErr = err as any;
      const message = axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to send message';
      setError(message);
      setLoading(false);
      return null;
    }
  }, []);

  return { send, loading, error };
}

// Fallback AI reply generation
export function useGenerateAiReply() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (conversationId: string, messageHistory: { role: string; text: string }[]): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<{ reply: string }>('/ai/reply', { conversationId, messageHistory });
      setLoading(false);
      return result.reply;
    } catch (err: unknown) {
      const axiosErr = err as any;
      const message = axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to generate reply';
      setError(message);
      setLoading(false);
      return null;
    }
  }, []);

  return { generate, loading, error };
}
