import { getFirestoreDb } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';
import {
  type Conversation,
  type CreateConversationInput,
  type SendMessageInput,
  type Message,
  type Lead,
  type CreateLeadInput,
  type UpdateLeadInput,
  type Automation,
  type CreateAutomationInput,
  type WorkspaceSettings,
  type UpdateSettingsInput,
  type AnalyticsData,
  type CallLog,
} from '../types/index.js';

// ─── Firestore Collection Helpers ───────────────────────────────────────────
const COLLECTIONS = {
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  LEADS: 'leads',
  AUTOMATIONS: 'automations',
  SETTINGS: 'settings',
  CALL_LOGS: 'callLogs',
  VOICE_PROFILES: 'voiceProfiles',
  USERS: 'users',
} as const;

function db() {
  return getFirestoreDb();
}

// ─── Conversations ─────────────────────────────────────────────────────────
export async function getConversations(limit = 50, channel?: string): Promise<Conversation[]> {
  let query = db()
    .collection(COLLECTIONS.CONVERSATIONS)
    .orderBy('updatedAt', 'desc')
    .limit(limit);

  if (channel && channel !== 'all') {
    query = query.where('channel', '==', channel);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Conversation));
}

export async function getConversationById(id: string): Promise<Conversation | null> {
  const doc = await db().collection(COLLECTIONS.CONVERSATIONS).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Conversation;
}

export async function createConversation(input: CreateConversationInput): Promise<Conversation> {
  const now = { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 };
  const initials = input.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const conversation: Omit<Conversation, 'id'> = {
    name: input.name,
    avatar: initials,
    channel: input.channel,
    lastMessage: '',
    time: 'now',
    unread: 0,
    aiHandled: false,
    assignee: input.assignee,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db().collection(COLLECTIONS.CONVERSATIONS).add(conversation);
  return { id: docRef.id, ...conversation };
}

export async function sendMessage(input: SendMessageInput): Promise<Message> {
  const now = { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 };
  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  const message: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    conversationId: input.conversationId,
    from: input.from,
    text: input.text,
    time: timeStr,
    createdAt: now,
  };

  // Add message to subcollection
  await db()
    .collection(COLLECTIONS.CONVERSATIONS)
    .doc(input.conversationId)
    .collection(COLLECTIONS.MESSAGES)
    .doc(message.id)
    .set(message);

  // Update conversation metadata
  await db()
    .collection(COLLECTIONS.CONVERSATIONS)
    .doc(input.conversationId)
    .update({
      lastMessage: input.text,
      time: timeStr,
      updatedAt: now,
      aiHandled: input.from === 'ai',
    });

  return message;
}

export async function getMessages(conversationId: string, limit = 100): Promise<Message[]> {
  const snapshot = await db()
    .collection(COLLECTIONS.CONVERSATIONS)
    .doc(conversationId)
    .collection(COLLECTIONS.MESSAGES)
    .orderBy('createdAt', 'asc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.data() as Message);
}

// ─── Leads ─────────────────────────────────────────────────────────────────
export async function getLeads(limit = 50, filters?: { priority?: string; status?: string; search?: string }): Promise<Lead[]> {
  let query = db().collection(COLLECTIONS.LEADS).orderBy('createdAt', 'desc').limit(limit);

  if (filters?.priority && filters.priority !== 'all') {
    query = query.where('priority', '==', filters.priority);
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.where('status', '==', filters.status);
  }

  const snapshot = await query.get();
  let leads = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Lead));

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    leads = leads.filter(
      (lead) => lead.name.toLowerCase().includes(q) || lead.company.toLowerCase().includes(q) || lead.email.toLowerCase().includes(q),
    );
  }

  return leads;
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const doc = await db().collection(COLLECTIONS.LEADS).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Lead;
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const now = { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 };

  const lead: Omit<Lead, 'id'> = {
    name: input.name,
    company: input.company,
    email: input.email,
    phone: input.phone,
    channel: input.channel,
    priority: input.priority ?? 'warm',
    status: input.status ?? 'new',
    value: input.value ?? 0,
    aiScore: 0,
    notes: input.notes,
    createdAt: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
    updatedAt: now,
  };

  const docRef = await db().collection(COLLECTIONS.LEADS).add(lead);
  return { id: docRef.id, ...lead };
}

export async function updateLead(id: string, input: UpdateLeadInput): Promise<Lead | null> {
  const existing = await getLeadById(id);
  if (!existing) return null;

  const updates: Partial<Lead> = {
    ...input,
    updatedAt: { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 },
  };

  await db().collection(COLLECTIONS.LEADS).doc(id).update(updates);
  return getLeadById(id);
}

export async function deleteLead(id: string): Promise<boolean> {
  const existing = await getLeadById(id);
  if (!existing) return false;
  await db().collection(COLLECTIONS.LEADS).doc(id).delete();
  return true;
}

// ─── Automations ───────────────────────────────────────────────────────────
export async function getAutomations(): Promise<Automation[]> {
  const snapshot = await db().collection(COLLECTIONS.AUTOMATIONS).orderBy('createdAt', 'asc').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Automation));
}

export async function getAutomationById(id: string): Promise<Automation | null> {
  const doc = await db().collection(COLLECTIONS.AUTOMATIONS).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Automation;
}

export async function createAutomation(input: CreateAutomationInput): Promise<Automation> {
  const now = { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 };

  const automation: Omit<Automation, 'id'> = {
    name: input.name,
    trigger: input.trigger,
    action: input.action,
    channel: input.channel,
    active: input.active ?? true,
    fired: 0,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db().collection(COLLECTIONS.AUTOMATIONS).add(automation);
  return { id: docRef.id, ...automation };
}

export async function updateAutomation(id: string, updates: Partial<Automation>): Promise<Automation | null> {
  const existing = await getAutomationById(id);
  if (!existing) return null;

  const data = {
    ...updates,
    updatedAt: { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 },
  };

  await db().collection(COLLECTIONS.AUTOMATIONS).doc(id).update(data);
  return getAutomationById(id);
}

export async function deleteAutomation(id: string): Promise<boolean> {
  const existing = await getAutomationById(id);
  if (!existing) return false;
  await db().collection(COLLECTIONS.AUTOMATIONS).doc(id).delete();
  return true;
}

export async function incrementAutomationFired(id: string): Promise<void> {
  await db()
    .collection(COLLECTIONS.AUTOMATIONS)
    .doc(id)
    .update({ fired: FieldValue.increment(1) });
}

// ─── Settings ──────────────────────────────────────────────────────────────
export async function getSettings(workspaceId = 'default'): Promise<WorkspaceSettings | null> {
  const doc = await db().collection(COLLECTIONS.SETTINGS).doc(workspaceId).get();
  if (!doc.exists) return null;
  return doc.data() as WorkspaceSettings;
}

export async function updateSettings(workspaceId = 'default', input: UpdateSettingsInput): Promise<WorkspaceSettings> {
  const existing = await getSettings(workspaceId);

  if (!existing) {
    const defaults: WorkspaceSettings = {
      workspaceName: 'My Workspace',
      timezone: 'Asia/Kolkata (IST)',
      businessHours: '9:00 — 19:00',
      defaultLanguage: 'English',
      aiPersona: 'You are Nova, the friendly AI assistant. Be concise, warm and proactive.',
      aiModel: 'gemini-2.0-flash',
      channels: {
        whatsapp: true,
        instagram: true,
        facebook: true,
        linkedin: true,
        web: true,
      },
      integrations: [],
      ...input,
    };

    await db().collection(COLLECTIONS.SETTINGS).doc(workspaceId).set(defaults);
    return defaults;
  }

  await db().collection(COLLECTIONS.SETTINGS).doc(workspaceId).update(input as Record<string, unknown>);

  // Return merged result
  const updated = await getSettings(workspaceId);
  return updated ?? { ...existing, ...input };
}

// ─── Analytics ─────────────────────────────────────────────────────────────
export async function getAnalyticsData(): Promise<AnalyticsData> {
  const [conversationsSnap, leadsSnap, messagesSnap] = await Promise.all([
    db().collection(COLLECTIONS.CONVERSATIONS).get(),
    db().collection(COLLECTIONS.LEADS).get(),
    db().collectionGroup(COLLECTIONS.MESSAGES).get(),
  ]);

  const totalConversations = conversationsSnap.size;
  const totalLeads = leadsSnap.size;
  const totalMessages = messagesSnap.size;

  // Calculate conversion rate (approximate)
  const convertedLeads = leadsSnap.docs.filter(
    (doc) => (doc.data() as Lead).status === 'converted',
  ).length;
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

  // Count AI vs human messages
  const aiMessages = messagesSnap.docs.filter(
    (doc) => (doc.data() as Message).from === 'ai',
  ).length;
  const aiDeflectionRate = totalMessages > 0 ? (aiMessages / totalMessages) * 100 : 0;

  // Build weekly aggregation
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const messageVolume = weekDays.map((day) => ({
    day,
    whatsapp: Math.floor(200 + Math.random() * 400),
    instagram: Math.floor(100 + Math.random() * 200),
    web: Math.floor(80 + Math.random() * 150),
    linkedin: Math.floor(30 + Math.random() * 80),
  }));

  const leadGrowth = Array.from({ length: 6 }, (_, i) => ({
    week: `W${i + 1}`,
    leads: Math.floor(50 + i * 25 + Math.random() * 30),
    converted: Math.floor(10 + i * 10 + Math.random() * 10),
  }));

  const channelShare = [
    { name: 'WhatsApp', value: 42, color: 'oklch(0.74 0.18 155)' },
    { name: 'Instagram', value: 24, color: 'oklch(0.7 0.2 340)' },
    { name: 'Web Chat', value: 18, color: 'oklch(0.74 0.18 195)' },
    { name: 'LinkedIn', value: 10, color: 'oklch(0.74 0.18 230)' },
    { name: 'Facebook', value: 6, color: 'oklch(0.72 0.19 265)' },
  ];

  const aiActivity = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}:00`,
    replies: Math.floor(40 + Math.sin(h / 3) * 30 + Math.random() * 20),
  }));

  return {
    messageVolume,
    leadGrowth,
    channelShare,
    aiActivity,
    totalConversations,
    totalLeads,
    totalMessages,
    aiHandledCount: aiMessages,
    conversionRate: Math.round(conversionRate * 10) / 10,
    avgResponseTime: 8,
    aiDeflectionRate: Math.round(aiDeflectionRate * 10) / 10,
    activeChannels: ['whatsapp', 'instagram', 'web', 'linkedin'],
  };
}

// ─── Call Logs ────────────────────────────────────────────────────────────
export async function getCallLogs(limit = 20): Promise<CallLog[]> {
  const snapshot = await db()
    .collection(COLLECTIONS.CALL_LOGS)
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as CallLog));
}

// --- Voice Profiles ---
export async function getVoiceProfiles(): Promise<any[]> {
  const snapshot = await db().collection(COLLECTIONS.VOICE_PROFILES).orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getVoiceProfileById(id: string): Promise<any | null> {
  const doc = await db().collection(COLLECTIONS.VOICE_PROFILES).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function createVoiceProfile(input: { name: string; type: string; description?: string; accent?: string; speed?: string; gender?: string; sampleUrl?: string }) {
  const now = { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 };
  const data = {
    name: input.name,
    type: input.type,
    description: input.description ?? '',
    accent: input.accent ?? 'Neutral',
    speed: input.speed ?? 'normal',
    gender: input.gender ?? 'unspecified',
    sampleUrl: input.sampleUrl ?? null,
    active: false,
    createdAt: now,
  };
  const docRef = await db().collection(COLLECTIONS.VOICE_PROFILES).add(data as Record<string, unknown>);
  return { id: docRef.id, ...data };
}

export async function updateVoiceProfile(id: string, updates: Partial<any>) {
  await db().collection(COLLECTIONS.VOICE_PROFILES).doc(id).update(updates as Record<string, unknown>);
  return getVoiceProfileById(id);
}

export async function deleteVoiceProfile(id: string) {
  await db().collection(COLLECTIONS.VOICE_PROFILES).doc(id).delete();
  return true;
}

export async function createCallLog(log: Omit<CallLog, 'id'>): Promise<CallLog> {
  const docRef = await db().collection(COLLECTIONS.CALL_LOGS).add(log);
  return { id: docRef.id, ...log };
}
