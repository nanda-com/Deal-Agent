import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import type { Conversation, Message, MessageSender } from '@/types';
import api from '@/lib/api';

interface ConversationsContextType {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  refetch: () => Promise<void>;
  // Message operations
  sendMessage: (conversationId: string, from: MessageSender, text: string) => Promise<Message | null>;
  // Optimistically update conversation
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  getConversation: (id: string) => Conversation | null;
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

interface ConversationsProviderProps {
  children: React.ReactNode;
  filter?: string;
  limit?: number;
}

export function ConversationsProvider({ children, filter, limit = 50 }: ConversationsProviderProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { limit: String(limit) };
      if (filter && filter !== 'all') params.channel = filter;
      const url = '/conversations?' + new URLSearchParams(params).toString();
      const result = await api.get<Conversation[]>(url);
      setConversations(result ?? []);
      // Auto-select first if none selected
      if (!selectedId && result && result.length > 0) {
        setSelectedId(result[0].id);
      }
    } catch (err: unknown) {
      const axiosErr = err as any;
      const message = axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to fetch conversations';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filter, limit, selectedId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Optimistic update for conversation (used when message is sent)
  const updateConversation = useCallback((id: string, updates: Partial<Conversation>) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === id ? { ...conv, ...updates, updatedAt: { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 } } : conv,
      ),
    );
  }, []);

  // Get a single conversation by id
  const getConversation = useCallback(
    (id: string) => conversations.find((c) => c.id === id) ?? null,
    [conversations],
  );

  // Send message and update conversation optimistically
  const sendMessage = useCallback(
    async (conversationId: string, from: MessageSender, text: string): Promise<Message | null> => {
      if (!text.trim()) return null;

      // Optimistic update: create a temporary message
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        conversationId,
        from,
        text: text.trim(),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        createdAt: { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 },
      };

      const previousConversations = conversations;

      // Update conversation optimistically
      updateConversation(conversationId, {
        lastMessage: text.trim(),
        time: 'now',
        unread: 0,
      });

      // Move conversation to top of list
      setConversations((prev) => {
        const conv = prev.find((c) => c.id === conversationId);
        if (!conv) return prev;
        return [conv, ...prev.filter((c) => c.id !== conversationId)];
      });

      try {
        // API call to persist the message
        const result = await api.post<Message>(`/conversations/${conversationId}/messages`, {
          conversationId,
          from,
          text: text.trim(),
        });

        // Replace temp message with real one from server
        return result;
      } catch (err: unknown) {
        console.error('[ConversationsContext] Failed to send message:', err);
        setConversations(previousConversations);
        const axiosErr = err as any;
        const errorMsg = axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to send message';
        throw new Error(errorMsg);
      }
    },
    [updateConversation],
  );

  return (
    <ConversationsContext.Provider
      value={{
        conversations,
        loading,
        error,
        selectedId,
        setSelectedId,
        refetch: fetchConversations,
        sendMessage,
        updateConversation,
        getConversation,
      }}
    >
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversationsContext() {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error('useConversationsContext must be used within ConversationsProvider');
  }
  return context;
}
