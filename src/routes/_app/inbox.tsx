import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Paperclip, Smile, MoreVertical, Phone, PhoneCall, PhoneOff, CheckCheck, RefreshCw, AlertCircle, Wifi, WifiOff, Inbox, User, UserPlus, Archive, Trash2, CheckCircle, Eye, ArrowRight, Calendar } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui-kit/Card';
import { SkeletonList } from '@/components/ui-kit/Skeleton';
import { EmptyState } from '@/components/ui-kit/EmptyState';
import { toast } from 'sonner';
import { channelMeta } from '@/types';
import type { Conversation, Message, Lead, Appointment } from '@/types';
import { useLeadsContext } from '@/contexts/LeadsContext';
import { useAppointmentsContext } from '@/contexts/AppointmentsContext';
import { useConversationsContext } from '@/contexts/ConversationsContext';
import { AppointmentModal } from '@/components/scheduling/AppointmentSetter';
import { SmartRecommendationCard } from '@/components/crm/SmartRecommendationCard';
import { useMessages } from '@/hooks/useConversations';
import { useSocketStatus, useConversationSocket } from '@/hooks/useSocket';
import { useGenerateAiReply, useSuggestedResponses, useSentimentAnalysis } from '@/hooks/useAi';
import { CascadeFlowBadge } from '@/components/ui-kit/CascadeFlowBadge';

const quickReplies = [
  'Thanks for reaching out — can you share more details?',
  'Let me check on that and get right back to you.',
  'Would Thursday 3pm work for a quick call?',
];

export function InboxPage() {
  const [filter, setFilter] = useState<string>('all');
  const [draft, setDraft] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callConnected, setCallConnected] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  // ─── Voice AI Modal State ─────────────────────────────────────
  const [showVoiceAiModal, setShowVoiceAiModal] = useState(false);
  const [voiceAiStep, setVoiceAiStep] = useState(0);
  const voiceAiTimerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // ─── AI Call Modal State ───────────────────────────────────────
  const [showAiCallModal, setShowAiCallModal] = useState(false);
  const [aiCallStep, setAiCallStep] = useState(0);
  const aiCallTimerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [createdLead, setCreatedLead] = useState<Lead | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [highlightAi, setHighlightAi] = useState(false);
  const deepLinkHandled = useRef(false);
  const { addLead, leads } = useLeadsContext();
  const { addAppointment } = useAppointmentsContext();
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  // Use ConversationsContext for shared state
  const {
    conversations: convos,
    loading: convosLoading,
    error: convosError,
    refetch: refetchConvos,
    selectedId: activeId,
    setSelectedId: setActiveId,
    sendMessage: contextSendMessage,
  } = useConversationsContext();

  const socketConnected = useSocketStatus();
  const {
    messages: socketMessages,
    typingUsers,
    onlineUsers,
    sendMessage: socketSend,
    startTyping,
    stopTyping,
  } = useConversationSocket(activeId);

  // Fetch API messages for active conversation
  const { data: messages, loading: messagesLoading } = useMessages(activeId);

  // ─── AI Hooks ──────────────────────────────────────────────────────
const {
  generate: generateAiReply,
  loading: aiReplyLoading,
  result: aiReplyResult,
  cascadeStats: aiCascadeStats,
} = useGenerateAiReply();
  const {
    generate: generateSuggestions,
    loading: suggestionsLoading,
    suggestions,
  } = useSuggestedResponses();
  const {
    analyze: analyzeSentiment,
    analysis: sentimentAnalysis,
    loading: analysisLoading,
  } = useSentimentAnalysis();

  // ─── CascadeFlow toast helper — call this directly after any AI response ──
  const showCascadeToast = useCallback((stats: import('@/hooks/useAi').CascadeStats | null | undefined) => {
    if (!stats) return;
    const isBlocked = stats.last_action === 'block';
    const pctUsed = ((stats.cost / stats.budget_max) * 100).toFixed(1);
    const toastFn = isBlocked ? toast.error : toast.success;
    toastFn(
      `⚡ CascadeFlow · ${stats.last_action.toUpperCase()}`,
      {
        description: [
          `Cost: $${stats.cost.toFixed(6)}`,
          `Latency: ${stats.latency_ms}ms`,
          `Budget used: ${pctUsed}%`,
          `Remaining: $${stats.budget_remaining.toFixed(6)}`,
        ].join('  ·  '),
        duration: 8000,
        id: `cascade-${stats.run_id}`,
      }
    );
  }, []);

  // Fetch suggested responses + sentiment when conversation changes
  useEffect(() => {
    if (!activeId || !messages || messages.length === 0) return;
    generateSuggestions(activeId, messages.map((m) => ({ role: m.from, text: m.text }))).then(({ cascadeStats }) => {
      showCascadeToast(cascadeStats);
    });
    analyzeSentiment(messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Merge API messages with socket messages, deduplicating by ID
  const activeMessages = activeId
    ? [...new Map([...(messages ?? []), ...socketMessages].map((m) => [m.id, m])).values()]
    : [];
  const active = convos?.find((c) => c.id === activeId) ?? null;
  const filtered = convos ?? [];

  // Deep link: /inbox?conversation=123&highlight=ai
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    const fallbackName = searchParams.get('name');
    if (!conversationId) {
      deepLinkHandled.current = false;
      return;
    }
    if (convosLoading || !convos) return;

    const found =
      convos.find((c) => c.id === conversationId) ??
      (fallbackName ? convos.find((c) => c.name === fallbackName) : undefined);
    if (found) {
      setActiveId(found.id);
      setHighlightAi(searchParams.get('highlight') === 'ai');
      deepLinkHandled.current = true;
      return;
    }

    if (!deepLinkHandled.current) {
      deepLinkHandled.current = true;
      toast.error('Related item not found');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, convos, convosLoading, setActiveId, setSearchParams]);

  // Auto-select first conversation when data loads (skip when deep linking)
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId) return;
    if (!activeId && convos && convos.length > 0) {
      setActiveId(convos[0].id);
    }
  }, [convos, activeId, setActiveId, searchParams]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeMessages.length, typingUsers.length]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Call timer
  useEffect(() => {
    if (!callConnected) return;
    const timer = window.setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [callConnected]);

  // Voice AI step timer: automatically advance through steps
  useEffect(() => {
    if (!showVoiceAiModal) {
      voiceAiTimerRef.current.forEach(clearTimeout);
      voiceAiTimerRef.current = [];
      setVoiceAiStep(0);
      return;
    }

    if (voiceAiStep === 0) {
      const t = setTimeout(() => setVoiceAiStep(1), 2000);
      voiceAiTimerRef.current = [t];
    } else if (voiceAiStep === 1) {
      const t = setTimeout(() => setVoiceAiStep(2), 2000);
      voiceAiTimerRef.current = [t];
    } else if (voiceAiStep === 2) {
      const t = setTimeout(() => setVoiceAiStep(3), 2500);
      voiceAiTimerRef.current = [t];
    }
    return () => {
      voiceAiTimerRef.current.forEach(clearTimeout);
    };
  }, [showVoiceAiModal, voiceAiStep]);

  // AI Call step timer: automatically advance through steps
  useEffect(() => {
    if (!showAiCallModal) {
      aiCallTimerRef.current.forEach(clearTimeout);
      aiCallTimerRef.current = [];
      setAiCallStep(0);
      return;
    }

    if (aiCallStep < 5) {
      const t = setTimeout(() => setAiCallStep((s) => s + 1), 2000);
      aiCallTimerRef.current = [t];
    }
    return () => {
      aiCallTimerRef.current.forEach(clearTimeout);
    };
  }, [showAiCallModal, aiCallStep]);

  // Send message: use context to update state optimistically and persist via API
  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || !activeId) return;
      try {
        // Send via context (handles API persistence + optimistic update)
        const message = await contextSendMessage(activeId, 'agent', text);
        if (message) {
          // Also broadcast via socket for real-time sync
          socketSend(text);
          setDraft('');
          stopTyping();
        }
      } catch (err) {
        const error = err as Error;
        toast.error('Failed to send message', { description: error.message });
      }
    },
    [activeId, contextSendMessage, socketSend, stopTyping],
  );

  // Typing indicator handling
  const handleTyping = useCallback((value: string) => {
    setDraft(value);
    if (value.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  }, [startTyping, stopTyping]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send(draft);
    }
  }, [send, draft]);

  if (convosLoading && !convos) {
    return (
      <div className="h-[calc(100vh-8rem)] grid grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[320px_1fr_320px] gap-4 animate-fade-in">
        <div className="glass rounded-2xl flex flex-col overflow-hidden">
          <SkeletonList rows={6} />
        </div>
        <div className="glass rounded-2xl flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-accent animate-spin" />
        </div>
      </div>
    );
  }

  if (convosError) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <p className="mt-3 text-sm text-rose-300 font-medium">Failed to load conversations</p>
        <p className="mt-1 text-xs text-muted-foreground">{convosError}</p>
        <button onClick={refetchConvos} className="mt-4 px-4 h-10 rounded-xl glass text-sm hover:bg-white/10 transition">Try again</button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] grid grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[320px_1fr_320px] gap-4">
      <div className="glass rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Inbox</h2>
            {socketConnected ? (
              <Wifi className="w-3 h-3 text-emerald-400" aria-label="Connected" />
            ) : (
              <WifiOff className="w-3 h-3 text-rose-400" aria-label="Disconnected" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{filtered.length} conversations</p>
            <button onClick={refetchConvos} className="ml-auto p-1 rounded hover:bg-white/10">
              <RefreshCw className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {(['all', 'whatsapp', 'instagram', 'facebook', 'linkedin', 'web'] as const).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  filter === value ? 'grad-primary text-white' : 'glass hover:bg-white/10 text-muted-foreground'
                }`}
              >
                {value === 'all' ? 'All' : channelMeta[value].label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {messagesLoading && activeId && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              <RefreshCw className="w-4 h-4 text-accent animate-spin mx-auto" />
              Loading messages…
            </div>
          )}
          {filtered.length === 0 && !convosLoading && (
            <EmptyState
              icon={<Inbox className="w-6 h-6" />}
              title="No conversations yet"
              description="When messages come in from any channel, they'll appear here."
            />
          )}
          {filtered.map((conversation) => {
            const meta = channelMeta[conversation.channel];
            const isActive = conversation.id === activeId;
            return (
              <button
                key={conversation.id}
                onClick={() => setActiveId(conversation.id)}
                className={`w-full text-left px-4 py-3 flex gap-3 border-l-2 transition ${
                  isActive ? 'bg-white/5 border-primary' : 'border-transparent hover:bg-white/3'
                }`}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full grad-primary grid place-items-center text-sm font-semibold">
                    {conversation.avatar}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${meta.dot} ring-2 ring-card`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <div className="font-medium text-sm truncate">{conversation.name}</div>
                    <div className="text-[10px] text-muted-foreground shrink-0">{conversation.time}</div>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{conversation.lastMessage}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {conversation.aiHandled && <Badge tone="primary">AI</Badge>}
                    {conversation.assignee && <Badge>{conversation.assignee}</Badge>}
                    {conversation.unread > 0 && (
                      <span className="ml-auto w-4 h-4 rounded-full grad-primary text-[10px] grid place-items-center font-bold text-white">
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {!active ? (
        <div className="glass rounded-2xl flex items-center justify-center min-w-0">
          <p className="text-muted-foreground text-sm">Select a conversation</p>
        </div>
      ) : (
      <div className={`glass rounded-2xl flex flex-col overflow-hidden min-w-0 transition-shadow ${highlightAi ? 'ring-2 ring-primary/40 shadow-lg shadow-primary/10' : ''}`}>
        <div className="px-5 py-3.5 border-b border-border/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full grad-primary grid place-items-center text-sm font-semibold">
            {active.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{active.name}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${onlineUsers.length > 0 ? 'bg-emerald-400' : 'bg-gray-500'}`} />
              {channelMeta[active.channel].label} · {onlineUsers.length > 0 ? 'online' : 'offline'}
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => {
                toast.success('Calling customer...', { description: 'Dialing +1 555 0192' });
                setShowCallModal(true);
              }}
              className="p-2 rounded-lg hover:bg-white/10 transition"
              title="Call customer"
            >
              <Phone className="w-4 h-4" />
            </button>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown((prev) => !prev)}
              className="p-2 rounded-lg hover:bg-white/10 transition"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 24, stiffness: 400 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-[#0f172a] text-white rounded-[12px] overflow-hidden shadow-2xl z-30"
                >
                  <button
                    onClick={() => {
                      toast.success('Customer profile', { description: 'Loading ' + active.name + '\'s full profile...' });
                      setShowDropdown(false);
                    }}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 transition"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    View customer profile
                  </button>
                  <button
                    onClick={() => {
                      toast.success('Assign agent', { description: 'Opening team assignment dialog...' });
                      setShowDropdown(false);
                    }}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 transition"
                  >
                    <UserPlus className="w-4 h-4 text-muted-foreground" />
                    Assign agent
                  </button>
                  <button
                    onClick={() => {
                      toast.success('Conversation archived', { description: 'Moved to archive folder' });
                      setShowDropdown(false);
                    }}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 transition"
                  >
                    <Archive className="w-4 h-4 text-muted-foreground" />
                    Archive conversation
                  </button>
                  <div className="border-t border-border/60" />
                  <button
                    onClick={() => {
                      toast.error('Conversation deleted', { description: 'Chat with ' + active.name + ' has been removed' });
                      setShowDropdown(false);
                    }}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-rose-300 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete conversation
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {highlightAi && (
          <div className="px-5 py-2.5 bg-primary/10 border-b border-primary/20 flex items-center gap-2 text-xs text-primary">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>AI-generated replies in this conversation</span>
            <button
              type="button"
              onClick={() => setHighlightAi(false)}
              className="ml-auto text-muted-foreground hover:text-foreground transition"
            >
              Dismiss
            </button>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
          {activeMessages.length === 0 && (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              No messages yet. Start a conversation.
            </div>
          )}
          {activeMessages.map((message) => (
            <Bubble key={message.id} message={message} highlightAi={highlightAi} />
          ))}
          <AnimatePresence>
            {typingUsers.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3 text-accent" />
                {typingUsers.includes('ai') ? 'AI is composing' : typingUsers.length + ' user(s) typing'}
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-accent animate-bounce" />
                  <span className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0.3s' }} />
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 border-t border-border/60 space-y-3">
        <div className="flex gap-3 mb-3">

  <button
    onClick={() => { setShowVoiceAiModal(true); setVoiceAiStep(0); }}
    className="bg-white/10 hover:bg-white/20 transition px-4 py-2 rounded-xl text-sm"
  >
    🎤 Voice AI
  </button>

  <button
    onClick={() => { setShowAiCallModal(true); setAiCallStep(0); }}
    className="bg-white/10 hover:bg-white/20 transition px-4 py-2 rounded-xl text-sm"
  >
    📞 AI Call
  </button>

</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(suggestions.length > 0 ? suggestions : quickReplies).map((reply, index) => (
              <button
                key={index}
                onClick={() => send(reply)}
                className="shrink-0 px-3 py-1.5 rounded-full glass hover:bg-white/10 text-xs flex items-center gap-1.5"
              >
                {suggestions.length > 0 ? (
                  <Sparkles className="w-3 h-3 text-accent" />
                ) : null}
                {suggestionsLoading ? (
                  <RefreshCw className="w-3 h-3 text-accent animate-spin" />
                ) : reply.length > 38 ? `${reply.slice(0, 38)}…` : reply}
              </button>
            ))}
            {suggestions.length === 0 && activeMessages.length > 0 && (
              <button
                onClick={() => {
                  if (!activeId || !messages) return;
                  generateSuggestions(activeId, messages.map((m) => ({ role: m.from, text: m.text }))).then(({ suggestions: list, cascadeStats }) => {
                    showCascadeToast(cascadeStats);
                    if (list.length > 0) toast.success(`✨ ${list.length} AI suggestions ready`);
                  });
                }}
                className="shrink-0 px-3 py-1.5 rounded-full glass hover:bg-white/10 text-xs text-accent"
              >
                <Sparkles className="w-3 h-3 inline mr-1" /> AI suggest
              </button>
            )}
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => toast('📎 File attachments coming soon', { description: 'Drag & drop files will be available in the next release' })}
              className="p-2.5 rounded-xl glass hover:bg-white/10 transition"
              title="Attach files"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              onClick={() => toast('😊 Emoji picker coming soon', { description: 'You can type emojis manually with :emoji_name:' })}
              className="p-2.5 rounded-xl glass hover:bg-white/10 transition"
              title="Add emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
            <textarea
              value={draft}
              onChange={(event) => handleTyping(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Type a reply… or press / for AI suggestions"
              className="flex-1 resize-none rounded-xl bg-white/5 border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-32"
            />
            <button
              onClick={() => {
                if (!activeId || !messages || aiReplyLoading) return;
                generateAiReply(activeId, messages.map((m) => ({ role: m.from, text: m.text }))).then((reply) => {
                  if (reply?.reply) {
                    setDraft(reply.reply);
                    toast.success('✨ AI reply drafted');
                  }
                  // Show CascadeFlow stats — reply now includes cascadeStats directly
                  showCascadeToast(reply?.cascadeStats);
                });
              }}
              className={`h-11 px-3 rounded-xl text-sm flex items-center gap-1.5 ${aiReplyLoading ? 'glass opacity-60' : 'glass hover:bg-white/10'}`}
              title="Generate AI reply (⚡ CascadeFlow budgeted)"
            >
              <Sparkles className={`w-4 h-4 text-accent ${aiReplyLoading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => send(draft)} className="h-11 px-4 rounded-xl grad-primary text-white font-medium flex items-center gap-2">
              <Send className="w-4 h-4" /> Send
            </button>
          </div>
        </div>
      </div>
      )}      {/* ─── Incoming Call Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {showCallModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4"
              onClick={() => { setShowCallModal(false); setCallConnected(false); setCallSeconds(0); }}
            >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9 }}
              className="bg-[#0f172a] text-white rounded-[16px] shadow-2xl p-8 max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              {!callConnected ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ repeat: Infinity, duration: 1.6 }}
                    className="w-24 h-24 rounded-full grad-primary grid place-items-center mx-auto mt-2 text-2xl font-bold"
                  >
                    {active?.avatar}
                  </motion.div>
                  <h3 className="text-xl font-bold mt-4">{active?.name}</h3>
                  <p className="text-sm text-muted-foreground">{active ? channelMeta[active.channel].label : ''} · Calling...</p>

                  <div className="flex justify-center gap-6 mt-8">
                    <button
                      onClick={() => { setShowCallModal(false); setCallSeconds(0); }}
                      className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-600 grid place-items-center"
                    >
                      <PhoneOff className="w-6 h-6 text-white" />
                    </button>
                    <button
                      onClick={() => {
                        setCallConnected(true);
                        toast.success('📞 Call connected', { description: 'Connected to ' + active?.name });
                      }}
                      className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 grid place-items-center"
                    >
                      <Phone className="w-6 h-6 text-white" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 rounded-full grad-primary grid place-items-center mx-auto mt-2 text-2xl font-bold ring-4 ring-primary/30 ring-offset-4 ring-offset-[var(--card)]">
                    {active?.avatar}
                  </div>
                  <h3 className="text-xl font-bold mt-4">{active?.name}</h3>
                  <p className="text-sm text-muted-foreground">{active ? channelMeta[active.channel].label : ''} · Connected</p>
                  <div className="font-mono text-2xl font-bold mt-4 text-accent">
                    {String(Math.floor(callSeconds / 60)).padStart(2, '0')}:{String(callSeconds % 60).padStart(2, '0')}
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="glass rounded-xl p-3">
                      <div className="text-xs text-muted-foreground">Sentiment</div>
                      <div className="text-sm font-semibold text-emerald-400">Positive</div>
                    </div>
                    <div className="glass rounded-xl p-3">
                      <div className="text-xs text-muted-foreground">Duration</div>
                      <div className="text-sm font-semibold">{String(Math.floor(callSeconds / 60)).padStart(2, '0')}:{String(callSeconds % 60).padStart(2, '0')}</div>
                    </div>
                    <div className="glass rounded-xl p-3">
                      <div className="text-xs text-muted-foreground">AI Score</div>
                      <div className="text-sm font-semibold text-accent">92</div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-6 mt-8">
                    <button
                      onClick={() => {
                        setShowCallModal(false);
                        setCallConnected(false);
                        setCallSeconds(0);
                        const duration = String(Math.floor(callSeconds / 60)).padStart(2, '0') + ':' + String(callSeconds % 60).padStart(2, '0');
                        toast.success('📋 Call completed', { description: 'Duration: ' + duration + ' · AI summary saved' });
                      }}
                      className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-600 grid place-items-center"
                    >
                      <PhoneOff className="w-6 h-6 text-white" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Voice AI Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showVoiceAiModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4"
              onClick={() => setShowVoiceAiModal(false)}
            >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0f172a] text-white rounded-[16px] p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Title */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🎙️</span>
                <h2 className="text-lg font-bold">AI Voice Assistant</h2>
              </div>

              {/* Step 0: Listening */}
              {voiceAiStep === 0 && (
                <VoiceAiListening />
              )}

              {/* Step 1: Analyzing Intent */}
              {voiceAiStep === 1 && (
                <VoiceAiAnalyzing />
              )}

              {/* Step 2: AI Responding */}
              {voiceAiStep === 2 && (
                <VoiceAiResponding />
              )}

              {/* Step 3: Outcome */}
              {voiceAiStep === 3 && (
                <VoiceAiOutcome
                  onScheduleDemo={() => {
                    setShowVoiceAiModal(false);
                    setShowAppointmentModal(true);
                  }}
                  onCreateLead={() => {
                    const newLead = addLead({
                      name: active?.name ?? 'Priya Sharma',
                      company: active?.name?.toLowerCase().includes('priya') ? 'Vertex Retail' : 'Nimbus Labs',
                      email: (active?.name ?? 'priya.sharma').toLowerCase().replace(/\s/g, '.') + '@example.com',
                      phone: '+1 555 0192',
                      channel: active?.channel ?? 'web',
                      priority: 'hot',
                      status: 'new',
                      aiScore: 92,
                      value: 24500,
                      notes: 'Enterprise Pricing Inquiry - Voice AI generated lead',
                    });
                    setCreatedLead(newLead);
                    setShowVoiceAiModal(false);
                  }}
                  onClose={() => setShowVoiceAiModal(false)}
                />
              )}

              {/* Bottom close for early steps */}
              {voiceAiStep < 3 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowVoiceAiModal(false)}
                    className="text-xs text-muted-foreground hover:text-foreground transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── AI Call Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showAiCallModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4"
              onClick={() => setShowAiCallModal(false)}
            >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0f172a] text-white rounded-[16px] p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Title */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">📞</span>
                <h2 className="text-lg font-bold">AI Outbound Call</h2>
              </div>

              {/* Steps 0-4: Call timeline */}
              {aiCallStep < 5 && (
                <AiCallTimeline step={aiCallStep} />
              )}

              {/* Step 5: Completed / Summary */}
              {aiCallStep === 5 && (
                <AiCallSummary
                  onBookMeeting={() => {
                    const newAppt = addAppointment({
                      leadName: active?.name ?? 'Priya Sharma',
                      leadCompany: active?.name?.toLowerCase().includes('priya') ? 'Vertex Retail' : 'Nimbus Labs',
                      type: 'demo',
                      time: '3:00 PM',
                      date: 'Thursday',
                      duration: '30 min',
                      status: 'scheduled',
                      assignedTo: 'You',
                    });
                    setCreatedAppointment(newAppt);
                    setShowAiCallModal(false);
                  }}
                  onSendToCrm={() => {
                    const newLead = addLead({
                      name: active?.name ?? 'Priya Sharma',
                      company: active?.name?.toLowerCase().includes('priya') ? 'Vertex Retail' : 'Nimbus Labs',
                      email: (active?.name ?? 'priya.sharma').toLowerCase().replace(/\s/g, '.') + '@example.com',
                      phone: '+1 555 0192',
                      channel: active?.channel ?? 'web',
                      priority: 'hot',
                      status: 'new',
                      aiScore: 95,
                      value: 28500,
                      notes: 'AI Outbound Call - Demo Booked · Duration: 00:10 · Next Action: Follow Up',
                    });
                    setCreatedLead(newLead);
                    setShowAiCallModal(false);
                  }}
                  onClose={() => setShowAiCallModal(false)}
                />
              )}

              {/* Bottom close for early steps */}
              {aiCallStep < 5 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowAiCallModal(false)}
                    className="text-xs text-muted-foreground hover:text-foreground transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Appointment Booking Flow Modal ────────────────────────── */}
      <AppointmentModal
        open={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
      />

      {/* ─── Appointment Booked Success Modal ──────────────────────── */}
      <AnimatePresence>
        {createdAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md grid place-items-center p-4"
            onClick={() => setCreatedAppointment(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-strong rounded-3xl p-8 max-w-sm w-full ring-glow text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                className="w-16 h-16 rounded-full bg-emerald-500 grid place-items-center mx-auto"
              >
                <Calendar className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-lg font-bold mt-4">Meeting Booked Successfully</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {createdAppointment.leadName} · {createdAppointment.type} · {createdAppointment.date} at {createdAppointment.time}
              </p>

              <div className="grid grid-cols-3 gap-3 mt-6">
                <div className="glass rounded-xl p-3">
                  <div className="text-[10px] text-muted-foreground">Date</div>
                  <div className="text-sm font-bold">{createdAppointment.date}</div>
                </div>
                <div className="glass rounded-xl p-3">
                  <div className="text-[10px] text-muted-foreground">Time</div>
                  <div className="text-sm font-bold">{createdAppointment.time}</div>
                </div>
                <div className="glass rounded-xl p-3">
                  <div className="text-[10px] text-muted-foreground">Status</div>
                  <div className="text-sm font-bold capitalize text-emerald-400">{createdAppointment.status}</div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={() => {
                    navigate('/dashboard');
                  }}
                  className="w-full h-11 rounded-xl grad-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition active:scale-[0.98]"
                >
                  <Calendar className="w-4 h-4" />
                  View in Dashboard
                </button>
                <button
                  onClick={() => setCreatedAppointment(null)}
                  className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Lead Created Success Modal ────────────────────────────── */}
      <AnimatePresence>
        {createdLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md grid place-items-center p-4"
            onClick={() => setCreatedLead(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-strong rounded-3xl p-8 max-w-sm w-full ring-glow text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                className="w-16 h-16 rounded-full bg-emerald-500 grid place-items-center mx-auto"
              >
                <CheckCircle className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-lg font-bold mt-4">Lead Created Successfully</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {createdLead.name} · {createdLead.company}
              </p>

              <div className="grid grid-cols-3 gap-3 mt-6">
                <div className="glass rounded-xl p-3">
                  <div className="text-[10px] text-muted-foreground">Score</div>
                  <div className="text-lg font-bold text-accent">{createdLead.aiScore}</div>
                </div>
                <div className="glass rounded-xl p-3">
                  <div className="text-[10px] text-muted-foreground">Sentiment</div>
                  <div className="text-lg font-bold text-emerald-400">Positive</div>
                </div>
                <div className="glass rounded-xl p-3">
                  <div className="text-[10px] text-muted-foreground">Priority</div>
                  <div className="text-lg font-bold capitalize text-rose-400">{createdLead.priority}</div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={() => {
                    navigate('/leads', { state: { openLeadId: createdLead.id } });
                  }}
                  className="w-full h-11 rounded-xl grad-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition active:scale-[0.98]"
                >
                  <Eye className="w-4 h-4" />
                  View Lead
                </button>
                <button
                  onClick={() => {
                    navigate('/leads');
                  }}
                  className="w-full h-11 rounded-xl glass hover:bg-white/10 text-sm font-medium flex items-center justify-center gap-2 transition active:scale-[0.98]"
                >
                  <ArrowRight className="w-4 h-4" />
                  Go To Leads
                </button>
                <button
                  onClick={() => setCreatedLead(null)}
                  className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

          {active && (
            <div className="hidden xl:flex glass rounded-2xl flex-col overflow-hidden">
              <div className="p-5 border-b border-border/60">
                <div className="w-16 h-16 rounded-2xl grad-primary grid place-items-center text-xl font-bold mx-auto">{active.avatar}</div>
                <div className="text-center mt-3 font-semibold">{active.name}</div>
                <div className="text-xs text-muted-foreground text-center">{channelMeta[active.channel].label} contact</div>
              </div>
              <div className="overflow-y-auto flex-1 p-5 space-y-4 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    AI insights
                    {analysisLoading && <RefreshCw className="w-3 h-3 inline ml-1 text-accent animate-spin" />}
                  </div>
                  <div className="glass rounded-xl p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">Intent</span>
                      <Badge tone={sentimentAnalysis?.intent === 'purchase' ? 'primary' : sentimentAnalysis?.intent === 'complaint' ? 'danger' : 'info'}>
                        {sentimentAnalysis?.intent ? (sentimentAnalysis.intent.charAt(0).toUpperCase() + sentimentAnalysis.intent.slice(1)) : 'Purchase'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">Sentiment</span>
                      <Badge tone={sentimentAnalysis?.sentiment === 'positive' ? 'success' : sentimentAnalysis?.sentiment === 'negative' ? 'danger' : 'info'}>
                        {sentimentAnalysis?.sentiment ? (sentimentAnalysis.sentiment.charAt(0).toUpperCase() + sentimentAnalysis.sentiment.slice(1)) : 'Positive'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">Confidence</span>
                      <span className="text-xs font-medium">{sentimentAnalysis?.confidence ?? 94}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full grad-primary" style={{ width: `${sentimentAnalysis?.confidence ?? 94}%` }} />
                    </div>
                  </div>
                </div>

                {/* Sales Assistant */}
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">AI Sales Agent</div>
                  <div className="grad-primary rounded-xl p-3 text-white">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="w-3 h-3" />
                      <span className="text-[10px] uppercase tracking-widest opacity-80">Recommendation</span>
                    </div>
                    <p className="text-xs font-medium">Pro Plan ($49/user/mo) · Est. deal: $24.5k</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] bg-white/20 rounded px-1.5 py-0.5">78% conversion</span>
                      <span className="text-[10px] bg-white/20 rounded px-1.5 py-0.5">Schedule demo</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toast.success('🤖 AI Sales Agent', { description: 'Generating personalized proposal for ' + active.name })}
                    className="w-full text-left text-xs glass hover:bg-white/10 rounded-lg p-2.5 flex items-center gap-2"
                  >
                    <Sparkles className="w-3 h-3 text-accent" />
                    Generate proposal summary
                  </button>

                  {/* CascadeFlow Runtime Stats */}
                  <CascadeFlowBadge stats={aiCascadeStats} loading={aiReplyLoading} />
                </div>


                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Customer</div>
                  <div className="space-y-1.5 text-xs">
                    <Row label="Email" value={active.name.toLowerCase().replace(/\s/g, '.') + '@gmail.com'} />
                    <Row label="Phone" value="+1 555 0192" />
                    <Row label="Lifetime value" value="$2,840" />
                    <Row label="Last order" value="3 days ago" />
                  </div>
                </div>

                {/* Smart CRM Recommendations */}
                <SmartRecommendationCard
                  leadId={leads.find((l) => l.name === active?.name)?.id}
                  leadName={active?.name}
                  compact
                />
              </div>
            </div>
          )}
    </div>
  );
}

function Bubble({ message, highlightAi = false }: { message: Message; highlightAi?: boolean }) {
  const isMe = message.from === 'agent';
  const isAI = message.from === 'ai';

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
          isMe ? 'grad-primary text-white rounded-br-sm' : isAI ? 'glass-strong border-accent/30 rounded-bl-sm' : 'glass rounded-bl-sm'
        } ${highlightAi && isAI ? 'ring-2 ring-primary/50 bg-primary/10' : ''}`}
      >
        {isAI && (
          <div className="flex items-center gap-1 text-[10px] text-accent mb-1">
            <Sparkles className="w-3 h-3" /> AI · Gemini
          </div>
        )}
        <div className="leading-relaxed">{message.text}</div>
        <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'text-white/70 justify-end' : 'text-muted-foreground'}`}>
          {message.time} {isMe && <CheckCheck className="w-3 h-3" />}
        </div>
      </div>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}

// ─── Voice AI Sub-Components ───────────────────────────────────────────

function VoiceAiListening() {
  return (
    <div className="text-center">
      <div className="relative w-20 h-20 mx-auto">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="w-20 h-20 rounded-full grad-primary grid place-items-center text-3xl"
        >
          🎤
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.2, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="absolute inset-0 rounded-full bg-accent/20"
        />
      </div>
      <p className="mt-4 text-sm font-semibold text-accent">Listening...</p>
      <p className="mt-1 text-xs text-muted-foreground">Waiting for customer input</p>
    </div>
  );
}

function VoiceAiAnalyzing() {
  return (
    <div className="space-y-4">
      {/* Customer speech bubble */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%]"
      >
        <div className="text-[10px] text-muted-foreground mb-1">Customer</div>
        <p className="text-sm">"Hi, I need pricing information for a team of 50 employees."</p>
      </motion.div>

      {/* Analyzing status */}
      <div className="text-center pt-2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="w-8 h-8 mx-auto border-2 border-accent border-t-transparent rounded-full"
        />
        <p className="mt-3 text-sm font-semibold text-accent">Analyzing Intent...</p>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden max-w-xs mx-auto">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, ease: 'easeInOut' }}
            className="h-full grad-primary"
          />
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">Processing natural language...</p>
      </div>
    </div>
  );
}

function VoiceAiResponding() {
  return (
    <div className="space-y-4">
      {/* Intent detected card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Intent detected</span>
          <Badge tone="primary">Enterprise Pricing Inquiry</Badge>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">Confidence</span>
          <span className="text-sm font-semibold text-emerald-400">94%</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '94%' }}
            transition={{ duration: 1, delay: 0.3 }}
            className="h-full bg-emerald-400 rounded-full"
          />
        </div>
      </motion.div>

      {/* AI responding status */}
      <div className="pt-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-accent">
          <Sparkles className="w-4 h-4" />
          AI Responding...
        </div>

        {/* AI response bubble */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-3 grad-primary text-white rounded-2xl rounded-br-sm px-4 py-3 max-w-[85%] ml-auto"
        >
          <div className="text-[10px] text-white/70 mb-1">AI Assistant</div>
          <p className="text-sm leading-relaxed">
            "Based on your team size, our Pro Plan would be the best fit. Would you like to schedule a demo this Thursday?"
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function VoiceAiOutcome({
  onScheduleDemo,
  onCreateLead,
  onClose,
}: {
  onScheduleDemo: () => void;
  onCreateLead: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="glass rounded-2xl p-4 ring-1 ring-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-sm">Analysis Complete</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-xs text-muted-foreground">Lead Score</div>
            <div className="text-xl font-bold text-accent">92</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-xs text-muted-foreground">Sentiment</div>
            <div className="text-xl font-bold text-emerald-400">Positive</div>
          </div>
        </div>
        <div className="mt-3 glass rounded-xl p-3">
          <div className="text-xs text-muted-foreground">Recommended Action</div>
          <p className="text-sm font-semibold mt-0.5">Schedule a product demo for Enterprise Plan</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onScheduleDemo}
          className="w-full h-11 rounded-xl grad-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition active:scale-[0.98]"
        >
          📅 Schedule Demo
        </button>
        <button
          onClick={onCreateLead}
          className="w-full h-11 rounded-xl glass hover:bg-white/10 text-sm font-medium flex items-center justify-center gap-2 transition active:scale-[0.98]"
        >
          + Create Lead
        </button>
        <button
          onClick={onClose}
          className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition"
        >
          Close
        </button>
      </div>
    </motion.div>
  );
}

// ─── AI Call Sub-Components ────────────────────────────────────────────

const callSteps = [
  { label: 'Dialing customer...', detail: 'Connecting via voice network' },
  { label: 'Connected', detail: 'Customer: "Hello?"', ai: 'AI: "Hi Emma, this is OmniFlow AI. I\'m reaching out regarding your interest in our plans."' },
  { label: 'In conversation', detail: 'Customer: "We are evaluating solutions for our 50-person team."' },
  { label: 'AI responding', detail: 'AI: "I recommend our Pro Plan. Would you like a live demo this Thursday at 3 PM?"' },
  { label: 'Customer responded', detail: 'Customer: "Yes, that sounds good."' },
];

function AiCallTimeline({ step }: { step: number }) {
  return (
    <div className="space-y-4">
      {/* Dialing animation */}
      {step === 0 && (
        <div className="text-center py-4">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="w-16 h-16 rounded-full grad-primary grid place-items-center text-2xl mx-auto"
          >
            📞
          </motion.div>
          <p className="mt-3 text-sm font-semibold text-accent">Dialing customer...</p>
          <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden max-w-[200px] mx-auto">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              className="h-full grad-primary"
            />
          </div>
        </div>
      )}

      {/* Steps 1-4: conversation transcript */}
      {step >= 1 && (
        <div className="space-y-3">
          {/* Connected status */}
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 font-medium">Connected</span>
            <span className="text-muted-foreground">· {step * 2}s</span>
          </div>

          {/* Timeline of conversation bubbles */}
          {callSteps.slice(0, step + 1).map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {i === 1 && s.ai && (
                <div className="grad-primary text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%] ml-auto mb-2">
                  <div className="text-[10px] text-white/70 mb-0.5">AI</div>
                  <p className="text-sm">{s.ai}</p>
                </div>
              )}
              <div className="glass rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[85%]">
                <p className="text-sm">{s.detail}</p>
              </div>
            </motion.div>
          ))}

          {/* Typing indicator for current step */}
          {step < 5 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" />
                <span className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.15s' }} />
                <span className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.3s' }} />
              </span>
              {callSteps[step]?.label}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AiCallSummary({
  onBookMeeting,
  onSendToCrm,
  onClose,
}: {
  onBookMeeting: () => void;
  onSendToCrm: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Completed indicator */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="w-14 h-14 rounded-full bg-emerald-500 grid place-items-center text-2xl mx-auto"
        >
          ✓
        </motion.div>
        <p className="mt-2 text-sm font-semibold text-emerald-400">Call Completed</p>
      </div>

      {/* Summary card */}
      <div className="glass rounded-2xl p-4 ring-1 ring-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-sm">Call Summary</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-xs text-muted-foreground">Outcome</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">Demo Booked</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-xs text-muted-foreground">Lead Score</div>
            <div className="text-sm font-bold text-accent mt-0.5">95</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-xs text-muted-foreground">Call Duration</div>
            <div className="text-sm font-bold mt-0.5">00:10</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-xs text-muted-foreground">Next Action</div>
            <div className="text-sm font-bold text-accent mt-0.5">Follow Up</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onBookMeeting}
          className="w-full h-11 rounded-xl grad-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition active:scale-[0.98]"
        >
          📅 Book Meeting
        </button>
        <button
          onClick={onSendToCrm}
          className="w-full h-11 rounded-xl glass hover:bg-white/10 text-sm font-medium flex items-center justify-center gap-2 transition active:scale-[0.98]"
        >
          ↗ Send to CRM
        </button>
        <button
          onClick={onClose}
          className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition"
        >
          Close
        </button>
      </div>
    </motion.div>
  );
}
