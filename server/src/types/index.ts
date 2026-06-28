// ─── Channel Types ─────────────────────────────────────────────────────────
export type Channel = 'whatsapp' | 'instagram' | 'facebook' | 'linkedin' | 'web';
export type LeadPriority = 'hot' | 'warm' | 'cold';
export type LeadStatus = 'new' | 'qualified' | 'contacted' | 'converted' | 'lost';
export type MessageSender = 'user' | 'ai' | 'agent';

// ─── Message ───────────────────────────────────────────────────────────────
export interface Message {
  id: string;
  conversationId: string;
  from: MessageSender;
  text: string;
  time: string;
  createdAt: FirebaseTimestamp;
}

// ─── Conversation ──────────────────────────────────────────────────────────
export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  channel: Channel;
  lastMessage: string;
  time: string;
  unread: number;
  aiHandled: boolean;
  assignee?: string;
  messages: Message[];
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

export interface CreateConversationInput {
  name: string;
  channel: Channel;
  assignee?: string;
}

export interface SendMessageInput {
  conversationId: string;
  from: MessageSender;
  text: string;
}

// ─── Lead ──────────────────────────────────────────────────────────────────
export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  channel: Channel;
  priority: LeadPriority;
  status: LeadStatus;
  value: number;
  aiScore: number;
  notes?: string;
  createdAt: string;
  updatedAt: FirebaseTimestamp;
}

export interface CreateLeadInput {
  name: string;
  company: string;
  email: string;
  phone: string;
  channel: Channel;
  priority?: LeadPriority;
  status?: LeadStatus;
  value?: number;
  notes?: string;
}

export interface UpdateLeadInput {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  channel?: Channel;
  priority?: LeadPriority;
  status?: LeadStatus;
  value?: number;
  aiScore?: number;
  notes?: string;
}

// ─── Automation ────────────────────────────────────────────────────────────
export interface Automation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  channel: Channel | 'all';
  active: boolean;
  fired: number;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

export interface CreateAutomationInput {
  name: string;
  trigger: string;
  action: string;
  channel: Channel | 'all';
  active?: boolean;
}

// ─── Settings ──────────────────────────────────────────────────────────────
export interface WorkspaceSettings {
  workspaceName: string;
  timezone: string;
  businessHours: string;
  defaultLanguage: string;
  aiPersona: string;
  aiModel: string;
  channels: Record<Channel, boolean>;
  integrations: string[];
}

export interface UpdateSettingsInput {
  workspaceName?: string;
  timezone?: string;
  businessHours?: string;
  defaultLanguage?: string;
  aiPersona?: string;
  aiModel?: string;
  channels?: Record<Channel, boolean>;
  integrations?: string[];
}

// ─── Analytics ─────────────────────────────────────────────────────────────
export interface MessageVolumeEntry {
  day: string;
  whatsapp: number;
  instagram: number;
  web: number;
  linkedin: number;
}

export interface LeadGrowthEntry {
  week: string;
  leads: number;
  converted: number;
}

export interface ChannelShareEntry {
  name: string;
  value: number;
  color: string;
}

export interface AiActivityEntry {
  hour: string;
  replies: number;
}

export interface AnalyticsData {
  messageVolume: MessageVolumeEntry[];
  leadGrowth: LeadGrowthEntry[];
  channelShare: ChannelShareEntry[];
  aiActivity: AiActivityEntry[];
  totalConversations: number;
  totalLeads: number;
  totalMessages: number;
  aiHandledCount: number;
  conversionRate: number;
  activeChannels: string[];
  avgResponseTime: number;
  aiDeflectionRate: number;
}

// ─── User / Auth ───────────────────────────────────────────────────────────
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: FirebaseTimestamp;
}

export interface AuthResponse {
  token: string;
  uid: string;
  email: string;
  displayName: string;
}

// ─── AI ────────────────────────────────────────────────────────────────────
export interface AiReplyRequest {
  conversationId: string;
  messageHistory: { role: 'user' | 'ai' | 'agent'; text: string }[];
  persona?: string;
}

export interface AiReplyResponse {
  reply: string;
  confidence: number;
  intent?: string;
  sentiment?: string;
}

export interface AiLeadScoreRequest {
  leadId: string;
  conversationHistory: { role: string; text: string }[];
}

export interface AiLeadScoreResponse {
  score: number;
  priority: LeadPriority;
  summary: string;
  suggestedAction: string;
}

// ─── Voice / Twilio ────────────────────────────────────────────────────────
export interface CallLog {
  id: string;
  callerName: string;
  callerNumber: string;
  duration: number;
  outcome: string;
  recordingUrl?: string;
  transcript?: string;
  aiSummary?: string;
  leadId?: string;
  timestamp: FirebaseTimestamp;
}

// ─── Voice Profile ───────────────────────────────────────────────────────
export interface VoiceProfile {
  id: string;
  name: string;
  type: string;
  description?: string;
  accent?: string;
  speed?: 'slow' | 'normal' | 'fast' | string;
  gender?: string;
  sampleUrl?: string;
  active?: boolean;
}

export interface CallBooking {
  time: string;
  name: string;
  hot?: boolean;
}

// ─── API Response Wrappers ─────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
  cascadeStats?: any;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ─── Firebase Timestamp ────────────────────────────────────────────────────
export type FirebaseTimestamp = {
  _seconds: number;
  _nanoseconds: number;
};
