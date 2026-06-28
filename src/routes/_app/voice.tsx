import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneCall, PhoneOff, Mic, MicOff, Sparkles, Calendar, FileText, Loader2, AlertCircle, RefreshCw, PhoneOutgoing, PhoneMissed, Target, Activity, TrendingUp, X } from 'lucide-react';
import { Badge, GlassCard } from '@/components/ui-kit/Card';
import { SkeletonCard } from '@/components/ui-kit/Skeleton';
import { EmptyState } from '@/components/ui-kit/EmptyState';
import { toast } from 'sonner';
import { useCallLogs, useMakeOutboundCall } from '@/hooks/useVoice';
import { VoiceProfileSelector } from '@/components/voice/VoiceProfileManager';
import type { CallLog } from '@/types';

const fallbackRecent: Array<CallLog & { name?: string; company?: string; time?: string }> = [
  {
    id: 'call-fallback-1',
    callerName: 'Priya Sharma',
    callerNumber: '+1 555 0192',
    duration: 134,
    outcome: 'Demo booked',
    time: '10 min ago',
    name: 'Priya Sharma',
    company: 'Vertex Retail',
    aiSummary: 'Customer inquired about CRM integration pricing for a 50-person team. Recommended Pro plan at $49/user/mo. Demo booked for Thursday 3:00pm IST.',
    transcript: 'Priya: Hi, I\'m calling about your CRM integration pricing.\nAgent: Happy to help. Are you on Starter, Pro, or Enterprise?\nPriya: We\'re a 50-person team — probably Pro.\nAgent: Pro includes WhatsApp, Instagram, and AI voice. Want a 20-minute walkthrough?\nPriya: Yes, Thursday afternoon works.\nAgent: Booked — Thursday 3:00pm IST with Sara from sales.',
    timestamp: { _seconds: Math.floor(Date.now() / 1000) - 600, _nanoseconds: 0 },
  },
  {
    id: 'call-fallback-2',
    callerName: 'Marcus Bauer',
    callerNumber: '+1 555 0193',
    duration: 242,
    outcome: 'Quote sent',
    time: '1h ago',
    name: 'Marcus Bauer',
    company: 'Helios Solar',
    aiSummary: 'Discussed enterprise solar CRM needs. Sent custom quote for 120-seat deployment.',
    timestamp: { _seconds: Math.floor(Date.now() / 1000) - 3600, _nanoseconds: 0 },
  },
  {
    id: 'call-fallback-3',
    callerName: 'Camila Rossi',
    callerNumber: '+1 555 0194',
    duration: 98,
    outcome: 'Voicemail',
    time: '2h ago',
    name: 'Camila Rossi',
    company: 'Aurora Cosmetics',
    aiSummary: 'Left voicemail regarding product demo follow-up. Callback scheduled.',
    timestamp: { _seconds: Math.floor(Date.now() / 1000) - 7200, _nanoseconds: 0 },
  },
];

const transcript = [
  { from: 'caller', text: 'Hi, I’m calling about your CRM integration pricing.' },
  { from: 'ai', text: 'Hi there! Happy to help. Are you on the Starter, Pro, or Enterprise plan?' },
  { from: 'caller', text: "We're a 50-person team — probably Pro." },
  { from: 'ai', text: 'Got it. Pro is $49 per user per month and includes WhatsApp, Instagram, and AI voice. Want me to book a 20-minute walkthrough?' },
  { from: 'caller', text: 'Yes, Thursday afternoon would be perfect.' },
  { from: 'ai', text: 'Done — Thursday at 3:00pm IST with Sara from sales. Calendar invite sent.' },
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m + 'm ' + s + 's';
}

function timeAgo(timestamp?: { _seconds: number }): string {
  if (!timestamp) return 'Unknown';
  const seconds = Math.floor(Date.now() / 1000) - timestamp._seconds;
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  return Math.floor(seconds / 86400) + 'd ago';
}

export function VoicePage() {
  const [incoming, setIncoming] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [step, setStep] = useState(0);
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showDialer, setShowDialer] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCall, setSelectedCall] = useState<(CallLog & { name?: string; company?: string; time?: string }) | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkHandled = useRef(false);

  const { data: callLogs, loading: logsLoading, error: logsError, refetch: refetchLogs } = useCallLogs();
  const { call: makeCall, loading: calling, error: callError, callSid } = useMakeOutboundCall();
  const [selectedVoiceProfile, setSelectedVoiceProfile] = useState<string | null>(null);

  const recentCalls = callLogs && callLogs.length > 0 ? callLogs : fallbackRecent;

  const openCallSummary = (call: CallLog & { name?: string; company?: string; time?: string }) => {
    setSelectedCall(call);
  };

  const closeCallSummary = () => {
    setSelectedCall(null);
    if (searchParams.get('call')) {
      setSearchParams({}, { replace: true });
    }
  };

  // Deep link: /voice?call=789
  useEffect(() => {
    const callId = searchParams.get('call');
    const fallbackName = searchParams.get('name');
    if (!callId) {
      deepLinkHandled.current = false;
      return;
    }
    if (logsLoading) return;

    const allCalls = [...(callLogs ?? []), ...fallbackRecent];
    const found =
      allCalls.find((c) => c.id === callId) ??
      (fallbackName
        ? allCalls.find((c) => (c.callerName || (c as { name?: string }).name) === fallbackName)
        : undefined);
    if (found) {
      setSelectedCall(found);
      requestAnimationFrame(() => {
        document.getElementById(`call-row-${found.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    if (!deepLinkHandled.current) {
      deepLinkHandled.current = true;
      toast.error('Related item not found');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, callLogs, logsLoading, setSearchParams]);

  useEffect(() => {
    if (!inCall) return;
    const timer = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    const transcriptTimer = window.setInterval(() => setStep((current) => Math.min(current + 1, transcript.length)), 2200);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(transcriptTimer);
    };
  }, [inCall]);

  const accept = () => {
    setIncoming(false);
    setInCall(true);
    setStep(0);
    setSeconds(0);
  };

  const end = () => {
    setInCall(false);
    toast.success('Call ended', { description: 'AI summary saved · Demo booked for Thu 3pm' });
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">AI Voice Calls</h1>
          <p className="text-sm text-muted-foreground mt-1">Simulated voice assistant — picks up, qualifies, books.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowDialer((p) => !p)} className="h-10 px-4 rounded-xl glass hover:bg-white/10 text-sm font-semibold flex items-center gap-2">
            <PhoneOutgoing className="w-4 h-4" /> Outbound call
          </button>
          <button onClick={() => setIncoming(true)} className="h-10 px-4 rounded-xl grad-primary text-white text-sm font-semibold flex items-center gap-2">
            <PhoneCall className="w-4 h-4" /> Simulate incoming call
          </button>
        </div>
      </div>

      {logsLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 animate-fade-in">
          <div className="glass rounded-2xl p-5 min-h-[420px]">
            <SkeletonCard />
            <div className="mt-4 space-y-3">
              <div className="skeleton h-4 w-48" />
              <div className="skeleton h-4 w-64" />
              <div className="skeleton h-4 w-56" />
            </div>
          </div>
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        <GlassCard className="min-h-[420px]">
          {!inCall ? (
            <EmptyState
              icon={<PhoneCall className="w-6 h-6" />}
              title="No active call"
              description="Click 'Simulate incoming call' to see the AI assistant handle a sales conversation end-to-end."
              action={
                <button onClick={() => setIncoming(true)} className="h-10 px-4 rounded-xl grad-primary text-white text-sm font-semibold">
                  <PhoneCall className="w-4 h-4 inline mr-1.5" /> Simulate incoming call
                </button>
              }
            />
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full grad-primary grid place-items-center text-sm font-bold">PS</div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-card" />
                  </div>
                  <div>
                    <div className="font-semibold">Priya Sharma</div>
                    <div className="text-xs text-muted-foreground">Vertex Retail · +1 555 0192</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-lg font-semibold">{mm}:{ss}</div>
                  <Badge tone="success">Connected</Badge>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-2">
                {transcript.slice(0, step).map((item, index) => (
                  <motion.div key={index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${item.from === 'ai' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${item.from === 'ai' ? 'grad-primary text-white' : 'glass'}`}>
                      <div className={`text-[10px] mb-1 ${item.from === 'ai' ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {item.from === 'ai' ? 'AI Assistant' : 'Caller'}
                      </div>
                      {item.text}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-5 flex justify-center gap-3">
                <button onClick={() => setMuted((current) => !current)} className={`w-12 h-12 rounded-full glass hover:bg-white/10 grid place-items-center ${muted ? 'text-rose-300' : ''}`}>
                  {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button onClick={end} className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-600 grid place-items-center">
                  <PhoneOff className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          )}
        </GlassCard>

        <div className="space-y-4">
          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-accent" />
              <h3 className="font-semibold">AI call summary</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Caller asked about Pro pricing for a 50-person team. Intent: <b className="text-foreground">high</b>. Booked demo for Thu 3pm IST with Sara.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="glass rounded-lg p-2.5 text-center">
                <div className="text-[10px] text-muted-foreground">Lead Score</div>
                <div className="flex items-center justify-center gap-1 text-sm font-bold text-accent">
                  <Target className="w-3 h-3" /> 92
                </div>
              </div>
              <div className="glass rounded-lg p-2.5 text-center">
                <div className="text-[10px] text-muted-foreground">Sentiment</div>
                <div className="flex items-center justify-center gap-1 text-sm font-bold text-emerald-400">
                  <Activity className="w-3 h-3" /> Positive
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              <Badge tone="success">Demo booked</Badge>
              <Badge tone="primary">Pro plan</Badge>
              <Badge tone="info">Enterprise potential</Badge>
            </div>
          </GlassCard>

          {/* Voice Profile Manager */}
          <GlassCard>
            <VoiceProfileSelector onSelect={(id) => setSelectedVoiceProfile(id)} />
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Recent calls</h3>
              <button onClick={refetchLogs} className="text-xs text-muted-foreground hover:text-foreground" disabled={logsLoading}>
                <RefreshCw className={'w-3.5 h-3.5 ' + (logsLoading ? 'animate-spin' : '')} />
              </button>
            </div>
            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : logsError ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
                <p className="text-xs text-muted-foreground">Failed to load call logs</p>
                <button onClick={refetchLogs} className="mt-2 text-xs text-accent hover:underline">Try again</button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {(recentCalls as Array<CallLog & { name?: string; company?: string; time?: string }>).slice(0, 10).map((call, index) => {
                  const name = call.callerName || call.name || 'Unknown';
                  const duration = call.duration ? (typeof call.duration === 'number' ? formatDuration(call.duration) : call.duration + 's') : '—';
                  const outcome = call.outcome || 'Completed';
                  const timestamp = call.timestamp ? timeAgo(call.timestamp) : call.time || '—';
                  const callId = call.id || `call-index-${index}`;
                  const isSelected = selectedCall?.id === call.id;
                  return (
                    <button
                      type="button"
                      key={callId}
                      id={`call-row-${callId}`}
                      onClick={() => openCallSummary({ ...call, id: callId })}
                      className={`w-full text-left py-2.5 first:pt-0 flex items-center gap-3 transition cursor-pointer rounded-lg px-1 -mx-1 hover:bg-white/5 active:scale-[0.99] ${
                        isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg glass-strong grid place-items-center">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{call.callerNumber || call.company || ''} · {duration}</div>
                      </div>
                      <div className="text-right">
                        <Badge tone={outcome === 'completed' || outcome === 'Demo booked' ? 'success' : outcome === 'failed' || outcome === 'Voicemail' ? 'danger' : 'info'} className="text-[10px]">{outcome}</Badge>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{timestamp}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-accent" />
              <h3 className="font-semibold">Today’s bookings</h3>
            </div>
            <div className="space-y-2 text-sm">
              <BookingRow time="2:00pm" name="Diego Alvarez" />
              <BookingRow time="3:00pm" name="Priya Sharma" hot />
              <BookingRow time="4:30pm" name="Sophia Chen" />
            </div>
            <button
              onClick={() => toast.success('📅 Calendar opened', { description: 'Showing today\'s schedule and upcoming bookings' })}
              className="mt-3 w-full h-9 rounded-xl glass hover:bg-white/10 text-xs flex items-center justify-center gap-2 transition"
            >
              <FileText className="w-3.5 h-3.5" /> Open calendar
            </button>
          </GlassCard>
        </div>
      </div>
      )}

      <AnimatePresence>
        {incoming && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md grid place-items-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} className="glass-strong rounded-3xl p-8 max-w-sm w-full text-center ring-glow">
              <div className="text-xs uppercase tracking-widest text-accent">Incoming call</div>
              <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 1.6 }} className="w-24 h-24 rounded-full grad-primary grid place-items-center mx-auto mt-5 text-2xl font-bold">
                PS
              </motion.div>
              <h3 className="text-xl font-bold mt-4">Priya Sharma</h3>
              <p className="text-sm text-muted-foreground">Vertex Retail · WhatsApp Business</p>
              <div className="flex justify-center gap-6 mt-8">
                <button onClick={() => setIncoming(false)} className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-600 grid place-items-center">
                  <PhoneOff className="w-6 h-6 text-white" />
                </button>
                <button onClick={accept} className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 grid place-items-center">
                  <Phone className="w-6 h-6 text-white" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md grid place-items-center p-4"
            onClick={closeCallSummary}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto ring-glow"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-accent flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5" /> Voice Call Summary
                  </div>
                  <h3 className="text-xl font-bold mt-1">
                    {selectedCall.callerName || selectedCall.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedCall.callerNumber || selectedCall.company || ''}
                    {selectedCall.duration ? ` · ${typeof selectedCall.duration === 'number' ? formatDuration(selectedCall.duration) : selectedCall.duration}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCallSummary}
                  className="p-2 rounded-lg hover:bg-white/10 transition"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <Badge tone="success" className="mb-4">{selectedCall.outcome}</Badge>

              {selectedCall.aiSummary && (
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-accent mb-2">
                    <Sparkles className="w-3.5 h-3.5" /> AI Summary
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed glass rounded-xl p-3">
                    {selectedCall.aiSummary}
                  </p>
                </div>
              )}

              {selectedCall.transcript && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">Transcript</div>
                  <pre className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed glass rounded-xl p-3 max-h-48 overflow-y-auto font-sans">
                    {selectedCall.transcript}
                  </pre>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDialer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md grid place-items-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} className="glass-strong rounded-3xl p-8 max-w-sm w-full">
              <div className="text-xs uppercase tracking-widest text-accent text-center">Outbound call</div>
              <h3 className="text-lg font-bold mt-4 text-center">Enter phone number</h3>
              <p className="text-sm text-muted-foreground text-center mt-1">The AI assistant will place the call and handle the conversation.</p>

              <div className="mt-6">
                <input
                  type="tel"
                  placeholder="+1 555 123 4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full h-12 glass rounded-xl px-4 text-sm font-mono text-center outline-none focus:ring-2 focus:ring-accent/50"
                />
                {callError && (
                  <p className="text-xs text-rose-400 text-center mt-2">{callError}</p>
                )}
                {callSid && (
                  <p className="text-xs text-emerald-400 text-center mt-2">Call initiated (SID: {callSid.slice(0, 12)}...)</p>
                )}
              </div>

              <div className="flex justify-center gap-6 mt-8">
                <button onClick={() => { setShowDialer(false); setPhoneNumber(''); }} className="w-32 h-12 rounded-xl glass hover:bg-white/10 text-sm font-semibold">
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!phoneNumber.trim()) return;
                    const result = await makeCall(phoneNumber.trim(), selectedVoiceProfile ?? undefined);
                    if (result) {
                      toast.success('Call initiated', { description: 'AI assistant is calling ' + phoneNumber });
                      setShowDialer(false);
                      setPhoneNumber('');
                    }
                  }}
                  disabled={calling || !phoneNumber.trim()}
                  className="w-32 h-12 rounded-xl grad-primary text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {calling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                  {calling ? 'Calling...' : 'Call'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BookingRow({ time, name, hot }: { time: string; name: string; hot?: boolean }) {
  return (
    <div className="flex items-center gap-3 glass rounded-lg p-2.5">
      <div className="text-xs font-mono font-semibold w-14">{time}</div>
      <div className="flex-1 text-sm">{name}</div>
      {hot && <Badge tone="danger">hot</Badge>}
    </div>
  );
}
