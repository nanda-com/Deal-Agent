import { v4 as uuidv4 } from 'uuid';
import { isFirebaseInitialized } from '../config/firebase.js';
import type {
  Conversation, CreateConversationInput, Message, SendMessageInput,
  Lead, CreateLeadInput, UpdateLeadInput,
  Automation, CreateAutomationInput,
  WorkspaceSettings, UpdateSettingsInput, AnalyticsData, CallLog, FirebaseTimestamp,
} from '../types/index.js';
import { generateSeedData } from './seedData.js';

// ─── Time Helpers ─────────────────────────────────────────────────────────────

function nowTimestamp(): FirebaseTimestamp {
  return { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 };
}

function timeStr(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function dateStr(): string {
  return new Date().toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// In-memory stores
const mockConversations = new Map<string, Conversation>();
const mockMessages = new Map<string, Message[]>();
const mockLeads = new Map<string, Lead>();
const mockAutomations = new Map<string, Automation>();
const mockCallLogs = new Map<string, CallLog>();
const mockVoiceProfiles = new Map<string, any>();
const mockSettings: Record<string, WorkspaceSettings> = {};

// Seed with rich demo data
const seed = generateSeedData();
seed.conversations.forEach((v, k) => mockConversations.set(k, v));
seed.messages.forEach((v, k) => mockMessages.set(k, v));
seed.leads.forEach((v, k) => mockLeads.set(k, v));
seed.automations.forEach((v, k) => mockAutomations.set(k, v));
seed.callLogs.forEach((v, k) => mockCallLogs.set(k, v));
// seed voice profiles
seed.voiceProfiles?.forEach((p: any) => mockVoiceProfiles.set(p.id, p));
Object.assign(mockSettings, seed.settings);

// --- Determine if we use Firebase or Mock ---
let firebaseModule: typeof import('./firebase.js') | null = null;

function useMock(): boolean {
  if (isFirebaseInitialized()) {
    return false;
  }
  return true;
}

async function getFirebaseModule() {
  if (!firebaseModule) {
    firebaseModule = await import('./firebase.js');
  }
  return firebaseModule;
}

// --- Conversations ---
export async function getConversations(limit = 50, channel?: string): Promise<Conversation[]> {
  if (!useMock()) {
    return (await getFirebaseModule()).getConversations(limit, channel);
  }
  let result = Array.from(mockConversations.values())
    .sort((a, b) => ((b.updatedAt?._seconds) ?? 0) - ((a.updatedAt?._seconds) ?? 0));
  if (channel && channel !== 'all') {
    result = result.filter((c) => c.channel === channel);
  }
  return result.slice(0, limit);
}

export async function getConversationById(id: string): Promise<Conversation | null> {
  if (!useMock()) return (await getFirebaseModule()).getConversationById(id);
  return mockConversations.get(id) ?? null;
}

export async function createConversation(input: CreateConversationInput): Promise<Conversation> {
  if (!useMock()) return (await getFirebaseModule()).createConversation(input);
  const id = 'conv-' + uuidv4().slice(0, 8);
  const ts = nowTimestamp();
  const initials = input.name.split(' ').map((p) => p[0]).join('').toUpperCase();
  const conversation: Conversation = {
    id, name: input.name, avatar: initials, channel: input.channel,
    lastMessage: '', time: 'now', unread: 0, aiHandled: false,
    assignee: input.assignee, messages: [], createdAt: ts, updatedAt: ts,
  };
  mockConversations.set(id, conversation);
  mockMessages.set(id, []);
  return conversation;
}

export async function sendMessage(input: SendMessageInput): Promise<Message> {
  if (!useMock()) return (await getFirebaseModule()).sendMessage(input);
  const id = 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  const ts = nowTimestamp();
  const time = timeStr();
  const message: Message = { id, conversationId: input.conversationId, from: input.from, text: input.text, time, createdAt: ts };
  const convMessages = mockMessages.get(input.conversationId) ?? [];
  convMessages.push(message);
  mockMessages.set(input.conversationId, convMessages);
  const conv = mockConversations.get(input.conversationId);
  if (conv) {
    conv.lastMessage = input.text; conv.time = time; conv.updatedAt = ts;
    conv.aiHandled = input.from === 'ai'; conv.messages = convMessages;
    mockConversations.set(input.conversationId, conv);
  }
  return message;
}

export async function getMessages(conversationId: string, limit = 100): Promise<Message[]> {
  if (!useMock()) return (await getFirebaseModule()).getMessages(conversationId, limit);
  return (mockMessages.get(conversationId) ?? [])
    .sort((a, b) => ((a.createdAt?._seconds) ?? 0) - ((b.createdAt?._seconds) ?? 0))
    .slice(0, limit);
}

// --- Leads ---
export async function getLeads(limit = 50, filters?: { priority?: string; status?: string; search?: string }): Promise<Lead[]> {
  if (!useMock()) return (await getFirebaseModule()).getLeads(limit, filters);
  let result = Array.from(mockLeads.values())
    .sort((a, b) => ((b.updatedAt?._seconds) ?? 0) - ((a.updatedAt?._seconds) ?? 0));
  if (filters?.priority && filters.priority !== 'all') {
    result = result.filter((l) => l.priority === filters.priority);
  }
  if (filters?.status && filters.status !== 'all') {
    result = result.filter((l) => l.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter((l) => l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) || l.email.toLowerCase().includes(q));
  }
  return result.slice(0, limit);
}

export async function getLeadById(id: string): Promise<Lead | null> {
  if (!useMock()) return (await getFirebaseModule()).getLeadById(id);
  return mockLeads.get(id) ?? null;
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  if (!useMock()) return (await getFirebaseModule()).createLead(input);
  const id = 'lead-' + uuidv4().slice(0, 8);
  const lead: Lead = {
    id, name: input.name, company: input.company, email: input.email,
    phone: input.phone, channel: input.channel, priority: input.priority ?? 'warm',
    status: input.status ?? 'new', value: input.value ?? 0, aiScore: 0,
    notes: input.notes, createdAt: dateStr(), updatedAt: nowTimestamp(),
  };
  mockLeads.set(id, lead);
  return lead;
}

export async function updateLead(id: string, input: UpdateLeadInput): Promise<Lead | null> {
  if (!useMock()) return (await getFirebaseModule()).updateLead(id, input);
  const existing = mockLeads.get(id);
  if (!existing) return null;
  const updated: Lead = { ...existing, ...input, updatedAt: nowTimestamp() };
  mockLeads.set(id, updated);
  return updated;
}

export async function deleteLead(id: string): Promise<boolean> {
  if (!useMock()) return (await getFirebaseModule()).deleteLead(id);
  return mockLeads.delete(id);
}

// --- Automations ---
export async function getAutomations(): Promise<Automation[]> {
  if (!useMock()) return (await getFirebaseModule()).getAutomations();
  return Array.from(mockAutomations.values())
    .sort((a, b) => ((a.createdAt?._seconds) ?? 0) - ((b.createdAt?._seconds) ?? 0));
}

export async function getAutomationById(id: string): Promise<Automation | null> {
  if (!useMock()) return (await getFirebaseModule()).getAutomationById(id);
  return mockAutomations.get(id) ?? null;
}

export async function createAutomation(input: CreateAutomationInput): Promise<Automation> {
  if (!useMock()) return (await getFirebaseModule()).createAutomation(input);
  const id = 'auto-' + uuidv4().slice(0, 8);
  const ts = nowTimestamp();
  const automation: Automation = {
    id, name: input.name, trigger: input.trigger, action: input.action,
    channel: input.channel, active: input.active ?? true, fired: 0,
    createdAt: ts, updatedAt: ts,
  };
  mockAutomations.set(id, automation);
  return automation;
}

export async function updateAutomation(id: string, updates: Partial<Automation>): Promise<Automation | null> {
  if (!useMock()) return (await getFirebaseModule()).updateAutomation(id, updates);
  const existing = mockAutomations.get(id);
  if (!existing) return null;
  const updated: Automation = { ...existing, ...updates, updatedAt: nowTimestamp() };
  mockAutomations.set(id, updated);
  return updated;
}

export async function deleteAutomation(id: string): Promise<boolean> {
  if (!useMock()) return (await getFirebaseModule()).deleteAutomation(id);
  return mockAutomations.delete(id);
}

export async function incrementAutomationFired(id: string): Promise<void> {
  if (!useMock()) return (await getFirebaseModule()).incrementAutomationFired(id);
  const existing = mockAutomations.get(id);
  if (existing) { existing.fired += 1; existing.updatedAt = nowTimestamp(); mockAutomations.set(id, existing); }
}

// --- Settings ---
export async function getSettings(workspaceId = 'default'): Promise<WorkspaceSettings | null> {
  if (!useMock()) return (await getFirebaseModule()).getSettings(workspaceId);
  return mockSettings[workspaceId] ?? null;
}

export async function updateSettings(workspaceId = 'default', input: UpdateSettingsInput): Promise<WorkspaceSettings> {
  if (!useMock()) return (await getFirebaseModule()).updateSettings(workspaceId, input);
  const existing = mockSettings[workspaceId];
  if (!existing) {
    const defaults: WorkspaceSettings = {
      workspaceName: 'My Workspace', timezone: 'Asia/Kolkata (IST)',
      businessHours: '9:00 to 19:00', defaultLanguage: 'English',
      aiPersona: 'You are Nova, the friendly AI assistant. Be concise, warm and proactive.',
      aiModel: 'gemini-2.0-flash',
      channels: { whatsapp: true, instagram: true, facebook: true, linkedin: true, web: true },
      integrations: [], ...input,
    };
    mockSettings[workspaceId] = defaults;
    return defaults;
  }
  const updated: WorkspaceSettings = { ...existing, ...input };
  mockSettings[workspaceId] = updated;
  return updated;
}

// --- Analytics ---
export async function getAnalyticsData(): Promise<AnalyticsData> {
  if (!useMock()) return (await getFirebaseModule()).getAnalyticsData();
  const totalConversations = mockConversations.size;
  const totalLeads = mockLeads.size;
  let totalMessages = 0;
  let aiMessages = 0;
  for (const msgs of mockMessages.values()) {
    totalMessages += msgs.length;
    aiMessages += msgs.filter((m) => m.from === 'ai').length;
  }
  const convertedLeads = Array.from(mockLeads.values()).filter((l) => l.status === 'converted').length;
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
  const aiDeflectionRate = totalMessages > 0 ? (aiMessages / totalMessages) * 100 : 0;
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    messageVolume: weekDays.map((day) => ({
      day, whatsapp: Math.floor(200 + Math.random() * 400),
      instagram: Math.floor(100 + Math.random() * 200),
      web: Math.floor(80 + Math.random() * 150),
      linkedin: Math.floor(30 + Math.random() * 80),
    })),
    leadGrowth: Array.from({ length: 6 }, (_, i) => ({
      week: 'W' + (i + 1), leads: Math.floor(50 + i * 25 + Math.random() * 30),
      converted: Math.floor(10 + i * 10 + Math.random() * 10),
    })),
    channelShare: [
      { name: 'WhatsApp', value: 42, color: 'oklch(0.74 0.18 155)' },
      { name: 'Instagram', value: 24, color: 'oklch(0.7 0.2 340)' },
      { name: 'Web Chat', value: 18, color: 'oklch(0.74 0.18 195)' },
      { name: 'LinkedIn', value: 10, color: 'oklch(0.74 0.18 230)' },
      { name: 'Facebook', value: 6, color: 'oklch(0.72 0.19 265)' },
    ],
    aiActivity: Array.from({ length: 24 }, (_, h) => ({
      hour: h + ':00', replies: Math.floor(40 + Math.sin(h / 3) * 20 + Math.random() * 30),
    })),
    totalConversations,
    totalLeads,
    totalMessages,
    aiHandledCount: aiMessages,
    conversionRate: parseFloat(conversionRate.toFixed(1)),
    aiDeflectionRate: parseFloat(aiDeflectionRate.toFixed(1)),
    avgResponseTime: 2.4,
    activeChannels: ['whatsapp', 'instagram', 'web', 'linkedin'],
  };
}

// --- Call Logs ---
export async function createCallLog(entry: Omit<CallLog, 'id'>): Promise<CallLog> {
  if (!useMock()) return (await getFirebaseModule()).createCallLog(entry);
  const id = 'call-' + uuidv4().slice(0, 8);
  const log: CallLog = { id, ...entry, timestamp: entry.timestamp ?? nowTimestamp() };
  mockCallLogs.set(id, log);
  return log;
}

export async function getCallLogs(limit = 50): Promise<CallLog[]> {
  if (!useMock()) return (await getFirebaseModule()).getCallLogs(limit);
  return Array.from(mockCallLogs.values())
    .sort((a, b) => ((b.timestamp?._seconds) ?? 0) - ((a.timestamp?._seconds) ?? 0))
    .slice(0, limit);
}

// --- Voice Profiles ---
export async function getVoiceProfiles(): Promise<any[]> {
  if (!useMock()) return (await getFirebaseModule()).getVoiceProfiles();
  return Array.from(mockVoiceProfiles.values());
}

export async function getVoiceProfileById(id: string): Promise<any | null> {
  if (!useMock()) return (await getFirebaseModule()).getVoiceProfileById(id);
  return mockVoiceProfiles.get(id) ?? null;
}

export async function createVoiceProfile(input: { name: string; type: string; description?: string; accent?: string; speed?: string; gender?: string; sampleUrl?: string }) {
  if (!useMock()) return (await getFirebaseModule()).createVoiceProfile(input);
  const id = 'vp-' + uuidv4().slice(0, 8);
  const profile = { id, name: input.name, type: input.type, description: input.description ?? '', accent: input.accent ?? 'Neutral', speed: (input.speed as any) ?? 'normal', gender: input.gender ?? 'unspecified', sampleUrl: input.sampleUrl, active: false };
  mockVoiceProfiles.set(id, profile);
  return profile;
}

export async function updateVoiceProfile(id: string, updates: Partial<any>) {
  if (!useMock()) return (await getFirebaseModule()).updateVoiceProfile(id, updates);
  const existing = mockVoiceProfiles.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...updates };
  mockVoiceProfiles.set(id, updated);
  return updated;
}

export async function deleteVoiceProfile(id: string) {
  if (!useMock()) return (await getFirebaseModule()).deleteVoiceProfile(id);
  return mockVoiceProfiles.delete(id);
}

// --- Seed data utilities ---
export function getMockConversations() { return mockConversations; }
export function getMockLeads() { return mockLeads; }
export function getMockMessages() { return mockMessages; }
