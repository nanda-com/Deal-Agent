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
  createdAt?: FirebaseTimestamp;
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
  createdAt?: FirebaseTimestamp;
  updatedAt?: FirebaseTimestamp;
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
  updatedAt?: FirebaseTimestamp;
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
  createdAt?: FirebaseTimestamp;
  updatedAt?: FirebaseTimestamp;
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

export type TenantRole = 'owner' | 'admin' | 'agent';

export interface AuditLogEntry {
  id: string;
  event: string;
  details: string;
  time: string;
}

export interface TenantInfo {
  id: string;
  companyName: string;
  logo: string;
  accentColor: string;
  plan: SubscriptionPlan;
  activeUsers: number;
  createdAt: string;
  role: TenantRole;
  mrr: number;
  arr: number;
  growth: number;
}

// ─── Voice / Call Log ──────────────────────────────────────────────────────
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

// ─── API Response ──────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
}

// ─── Firebase Timestamp ────────────────────────────────────────────────────
export interface FirebaseTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

// ─── Channel Meta ──────────────────────────────────────────────────────────
export const channelMeta: Record<Channel, { label: string; color: string; dot: string }> = {
  whatsapp: { label: 'WhatsApp', color: 'text-emerald-300', dot: 'bg-emerald-400' },
  instagram: { label: 'Instagram', color: 'text-pink-300', dot: 'bg-pink-400' },
  facebook: { label: 'Facebook', color: 'text-blue-300', dot: 'bg-blue-400' },
  linkedin: { label: 'LinkedIn', color: 'text-sky-300', dot: 'bg-sky-400' },
  web: { label: 'Web Chat', color: 'text-cyan-300', dot: 'bg-cyan-400' },
};

// ─── NEW: Voice Profile ────────────────────────────────────────────────────
export interface VoiceProfile {
  id: string;
  name: string;
  type: 'company' | 'sales' | 'support';
  description: string;
  accent: string;
  speed: 'slow' | 'normal' | 'fast';
  gender: string;
  active: boolean;
}

// ─── NEW: Campaign ─────────────────────────────────────────────────────────
export type CampaignStatus = 'draft' | 'sending' | 'completed' | 'paused';
export type CampaignChannel = 'whatsapp' | 'email' | 'sms';

export interface Campaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  audience: string;
  message: string;
  status: CampaignStatus;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  createdAt: string;
}

// ─── NEW: Workflow Node ────────────────────────────────────────────────────
export type WorkflowNodeType = 'trigger' | 'condition' | 'action';

export type WorkflowNodeConfig = Record<string, string | undefined>;

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  description: string;
  x: number;
  y: number;
  config: WorkflowNodeConfig;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  executions: number;
  successRate: number;
}

export interface WorkflowExecutionEntry {
  id: string;
  workflowId: string;
  workflowName: string;
  time: string;
  status: 'success' | 'failure';
  result: string;
  summary: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  nodes: Omit<WorkflowNode, 'x' | 'y'>[];
  active: boolean;
}

// ─── NEW: Appointment ──────────────────────────────────────────────────────
export interface Appointment {
  id: string;
  leadName: string;
  leadCompany: string;
  type: 'demo' | 'meeting' | 'call';
  time: string;
  date: string;
  duration: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  assignedTo: string;
}

// ─── NEW: Lead Scoring - Detailed ──────────────────────────────────────────
export interface LeadScoreBreakdown {
  overall: number;
  confidence: number;
  temperature: 'hot' | 'warm' | 'cold';
  factors: {
    label: string;
    score: number;
    maxScore: number;
    weight: number;
  }[];
  summary: string;
  recommendedAction: string;
}

// ─── NEW: Follow-up Rule ───────────────────────────────────────────────────
export interface FollowUpRule {
  id: string;
  name: string;
  trigger: 'no-reply-1d' | 'no-reply-3d' | 'demo-attended' | 'proposal-sent';
  action: 'send-reminder' | 'escalate' | 'create-task' | 'send-pricing';
  channel: Channel | 'all';
  active: boolean;
  fired: number;
}

// ─── NEW: CRM Recommendation ───────────────────────────────────────────────
export interface CrmRecommendation {
  id: string;
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  leadName?: string;
  leadId?: string;
}

// ─── NEW: Sales Agent Prediction ───────────────────────────────────────────
export interface SalesPrediction {
  recommendedPlan: string;
  estimatedDealSize: number;
  conversionChance: number;
  suggestedAction: string;
  score: number;
}

// ─── NEW: Sentiment Analysis Extended ──────────────────────────────────────
export interface SentimentResult {
  label: 'positive' | 'neutral' | 'negative';
  confidence: number;
  emotion: 'happy' | 'frustrated' | 'neutral' | 'interested' | 'urgent';
  score: number;
}

// ─── NEW: Workspace / Multi-Tenant ─────────────────────────────────────────
export type SubscriptionPlan = 'starter' | 'pro' | 'enterprise';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'agent' | 'viewer';
  avatar: string;
}

export interface Workspace {
  id: string;
  companyName: string;
  plan: SubscriptionPlan;
  members: TeamMember[];
  usage: {
    conversations: number;
    leads: number;
    apiCalls: number;
    storage: number;
  };
  billing: {
    amount: number;
    nextPayment: string;
    status: 'active' | 'past_due' | 'canceled';
  };
}
