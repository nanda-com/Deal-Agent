import { useState, useEffect, useMemo } from 'react';
import { conversations as mockConversations, automations as mockAutomations } from '@/lib/mockData';
import { useLeadsContext } from '@/contexts/LeadsContext';
import type { Conversation, Lead, Automation, Appointment } from '@/types';

export interface SearchResultItem {
  id: string;
  label: string;
  subtitle: string;
  category: 'conversations' | 'leads' | 'automations' | 'voice';
  icon: string;
  href: string;
  searchText: string;
  metadata?: Record<string, string>;
  leadId?: string;
}

export interface SearchResultGroup {
  category: SearchResultItem['category'];
  label: string;
  icon: string;
  items: SearchResultItem[];
}

function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

export function useGlobalSearch(query: string) {
  const { leads } = useLeadsContext();
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Debounce input by 300ms
  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery('');
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const results = useMemo((): SearchResultGroup[] => {
    const q = debouncedQuery.trim();
    if (!q) return [];

    const groups: SearchResultGroup[] = [];

    // Conversations
    const conversationsData = (mockConversations ?? []) as unknown as Conversation[];
    const convos = conversationsData.filter(
      (c) =>
        matchesQuery(c.name, q) ||
        matchesQuery(c.lastMessage, q) ||
        matchesQuery(c.channel, q),
    );
    if (convos.length > 0) {
      groups.push({
        category: 'conversations',
        label: 'Conversations',
        icon: '\u{1F4AC}',
        items: convos.map((c) => ({
          id: c.id,
          label: c.name,
          subtitle: c.lastMessage.length > 60 ? c.lastMessage.slice(0, 60) + '...' : c.lastMessage,
          category: 'conversations' as const,
          icon: c.avatar,
          href: '/inbox',
          searchText: c.name + ' ' + c.lastMessage + ' ' + c.channel,
          metadata: { channel: c.channel, unread: String(c.unread), time: c.time },
        })),
      });
    }

    // Leads
    const leadsList: Lead[] = leads ?? [];
    const matchedLeads = leadsList.filter(
      (l) =>
        matchesQuery(l.name, q) ||
        matchesQuery(l.company, q) ||
        matchesQuery(l.email, q) ||
        matchesQuery(l.channel, q) ||
        matchesQuery(l.status, q) ||
        matchesQuery(l.priority, q),
    );
    if (matchedLeads.length > 0) {
      groups.push({
        category: 'leads',
        label: 'Leads',
        icon: '\u{1F464}',
        items: matchedLeads.map((l) => ({
          id: l.id,
          label: l.name,
          subtitle: l.company + ' ' + l.priority + ' Score: ' + l.aiScore + ' $' + l.value.toLocaleString(),
          category: 'leads' as const,
          icon: l.name.split(' ').map((n) => n[0]).join('').slice(0, 2),
          href: '/leads',
          searchText: l.name + ' ' + l.company + ' ' + l.email + ' ' + l.channel + ' ' + l.status + ' ' + l.priority,
          leadId: l.id,
          metadata: { company: l.company, priority: l.priority, score: String(l.aiScore), value: '$' + l.value.toLocaleString() },
        })),
      });
    }

    // Automations
    const automationsList = (mockAutomations ?? []) as unknown as Automation[];
    const matchedAutomations = automationsList.filter(
      (a) =>
        matchesQuery(a.name, q) ||
        matchesQuery(a.trigger, q) ||
        matchesQuery(a.action, q) ||
        matchesQuery(a.channel, q),
    );
    if (matchedAutomations.length > 0) {
      groups.push({
        category: 'automations',
        label: 'Automations',
        icon: '\u26A1',
        items: matchedAutomations.map((a) => ({
          id: a.id,
          label: a.name,
          subtitle: a.trigger + ' ' + a.action,
          category: 'automations' as const,
          icon: a.active ? '\u26A1' : '\u23F8\uFE0F',
          href: '/automations',
          searchText: a.name + ' ' + a.trigger + ' ' + a.action + ' ' + a.channel,
          metadata: { channel: a.channel === 'all' ? 'All channels' : a.channel, active: a.active ? 'Active' : 'Paused', fired: String(a.fired) },
        })),
      });
    }

    // Voice Calls
    const voiceCallNames = ['Priya Sharma', 'Marcus Bauer', 'Camila Rossi', 'Diego Alvarez', 'Sophia Chen', 'Aisha Khan'];
    const matchedCalls = voiceCallNames.filter((name) => matchesQuery(name, q));
    if (matchedCalls.length > 0) {
      groups.push({
        category: 'voice',
        label: 'Voice Calls',
        icon: '\u{1F4DE}',
        items: matchedCalls.map((name) => ({
          id: 'voice-' + name.toLowerCase().replace(/\s/g, '-'),
          label: name,
          subtitle: 'AI Voice Call Recent call log',
          category: 'voice' as const,
          icon: '\u{1F4DE}',
          href: '/voice',
          searchText: name,
          metadata: { source: 'AI Voice' },
        })),
      });
    }

    return groups;
  }, [debouncedQuery, leads]);

  const totalCount = useMemo(
    () => results.reduce((sum, group) => sum + group.items.length, 0),
    [results],
  );

  return {
    query: debouncedQuery,
    results,
    totalCount,
    loading,
  };
}
