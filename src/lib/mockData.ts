export type Channel = 'whatsapp' | 'instagram' | 'facebook' | 'linkedin' | 'web';
export type LeadPriority = 'hot' | 'warm' | 'cold';
export type LeadStatus = 'new' | 'qualified' | 'contacted' | 'converted' | 'lost';

export interface Message {
  id: string;
  from: 'user' | 'ai' | 'agent';
  text: string;
  time: string;
}

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
}

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
  createdAt: string;
  aiScore: number;
}

export interface Automation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  channel: Channel | 'all';
  active: boolean;
  fired: number;
}

const names = [
  'Aarav Mehta', 'Priya Sharma', 'Diego Alvarez', 'Sophia Chen', "Liam O'Connor",
  'Aisha Khan', 'Noah Williams', 'Yuki Tanaka', 'Emma Johansson', 'Marcus Bauer',
  'Layla Hassan', 'Oliver Smith', 'Camila Rossi', 'Hiro Sato', 'Mia Dubois',
  'Ethan Park', 'Zara Ali', 'Lucas Silva', 'Nora Lindqvist', 'Ravi Iyer',
  'Chloe Martin', 'Omar Farouk', 'Isabella Romano', 'Kenji Watanabe', 'Ana Costa',
];

const companies = [
  'Nimbus Labs', 'Vertex Retail', 'Solace Health', 'Northwind Logistics',
  'Echo Studios', 'Pioneer Bank', 'Quantum EdTech', 'Helios Solar',
  'Aurora Cosmetics', 'BrightPath Realty', 'Polaris Travel', 'Cobalt Fitness',
];

const channels: Channel[] = ['whatsapp', 'instagram', 'facebook', 'linkedin', 'web'];
const sampleSnippets = [
  'Hi, do you ship internationally?',
  'Can I get a demo this week?',
  'What\u2019s the pricing for the team plan?',
  'Still interested \u2014 when can we talk?',
  'Thanks! Just booked the appointment.',
  'Is the AI assistant included in the Pro tier?',
  'I haven\u2019t received my order yet.',
  'Can someone from sales call me back?',
  'Loved the demo. Sending it to my CEO.',
  'Do you integrate with HubSpot?',
];

const aiReplies = [
  'Absolutely \u2014 we ship to 80+ countries with tracking included.',
  'I\u2019ve blocked Thursday 3pm IST on the calendar. Confirming shortly.',
  'Our Team plan is $49/user/mo with unlimited AI replies.',
  'Pulled up your last order \u2014 it\u2019s out for delivery today.',
  'Yes, native HubSpot, Salesforce and Pipedrive sync are included.',
];

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

function rand(seed: number) {
  return ((Math.sin(seed) + 1) / 2);
}

export const conversations: Conversation[] = Array.from({ length: 22 }, (_, i) => {
  const name = pick(names, i);
  const initials = name.split(' ').map((part) => part[0]).join('');
  const ch = pick(channels, i + 1);
  const snippet = pick(sampleSnippets, i);
  const aiReply = pick(aiReplies, i);
  const msgs: Message[] = [
    { id: `${i}-1`, from: 'user', text: snippet, time: '10:42' },
    { id: `${i}-2`, from: 'ai', text: aiReply, time: '10:42' },
    { id: `${i}-3`, from: 'user', text: "Perfect \u2014 let\u2019s go ahead.", time: '10:44' },
  ];

  if (i % 3 === 0) {
    msgs.push({ id: `${i}-4`, from: 'agent', text: "Thanks! I\u2019ll personally follow up.", time: '10:46' });
  }

  return {
    id: `conv-${i + 1}`,
    name,
    avatar: initials,
    channel: ch,
    lastMessage: msgs[msgs.length - 1].text,
    time: `${Math.floor(rand(i) * 11) + 1}m`,
    unread: i % 4 === 0 ? Math.floor(rand(i + 1) * 5) + 1 : 0,
    aiHandled: i % 2 === 0,
    assignee: i % 3 === 0 ? 'You' : i % 3 === 1 ? 'Sara' : undefined,
    messages: msgs,
  };
});

export const leads: Lead[] = Array.from({ length: 18 }, (_, i) => {
  const name = pick(names, i + 3);
  const priorities: LeadPriority[] = ['hot', 'warm', 'cold'];
  const statuses: LeadStatus[] = ['new', 'qualified', 'contacted', 'converted', 'lost'];
  const company = pick(companies, i);

  return {
    id: `lead-${i + 1}`,
    name,
    company,
    email: `${name.toLowerCase().replace(/[^a-z]/g, '.')}@${company.toLowerCase().replace(/\s/g, '')}.com`,
    phone: `+1 555 0${100 + i}`,
    channel: pick(channels, i),
    priority: pick(priorities, i),
    status: pick(statuses, i + 1),
    value: Math.floor(rand(i + 5) * 9000) + 500,
    createdAt: `${Math.floor(rand(i) * 28) + 1} Nov 2025`,
    aiScore: Math.floor(rand(i + 2) * 40) + 60,
  };
});

export const automations: Automation[] = [
  {
    id: 'a1',
    name: 'Welcome new WhatsApp leads',
    trigger: 'First message on WhatsApp',
    action: 'Send welcome + collect name',
    channel: 'whatsapp',
    active: true,
    fired: 1284,
  },
  {
    id: 'a2',
    name: 'Pricing intent \u2192 demo',
    trigger: "Message contains 'price' or 'cost'",
    action: 'Send pricing PDF + offer demo',
    channel: 'all',
    active: true,
    fired: 412,
  },
  {
    id: 'a3',
    name: 'After-hours auto reply',
    trigger: 'Outside 9am\u20137pm IST',
    action: 'Reply with hours + capture lead',
    channel: 'all',
    active: true,
    fired: 893,
  },
  {
    id: 'a4',
    name: 'Instagram DM triage',
    trigger: 'Story reply with emoji',
    action: 'Categorize + thank user',
    channel: 'instagram',
    active: true,
    fired: 220,
  },
  {
    id: 'a5',
    name: 'LinkedIn enterprise routing',
    trigger: 'Lead company > 500 employees',
    action: 'Assign to enterprise team',
    channel: 'linkedin',
    active: false,
    fired: 67,
  },
  {
    id: 'a6',
    name: 'Cart abandon nudge',
    trigger: 'No reply for 24h after quote',
    action: 'Send personalized follow-up',
    channel: 'web',
    active: true,
    fired: 156,
  },
];

export const messageVolume = [
  { day: 'Mon', whatsapp: 320, instagram: 180, web: 140, linkedin: 60 },
  { day: 'Tue', whatsapp: 410, instagram: 220, web: 190, linkedin: 80 },
  { day: 'Wed', whatsapp: 380, instagram: 260, web: 170, linkedin: 95 },
  { day: 'Thu', whatsapp: 520, instagram: 240, web: 220, linkedin: 110 },
  { day: 'Fri', whatsapp: 610, instagram: 310, web: 250, linkedin: 130 },
  { day: 'Sat', whatsapp: 480, instagram: 280, web: 200, linkedin: 70 },
  { day: 'Sun', whatsapp: 350, instagram: 210, web: 160, linkedin: 50 },
];

export const leadGrowth = [
  { week: 'W1', leads: 64, converted: 12 },
  { week: 'W2', leads: 92, converted: 21 },
  { week: 'W3', leads: 110, converted: 28 },
  { week: 'W4', leads: 138, converted: 41 },
  { week: 'W5', leads: 165, converted: 53 },
  { week: 'W6', leads: 198, converted: 68 },
];

export const channelShare = [
  { name: 'WhatsApp', value: 42, color: 'oklch(0.74 0.18 155)' },
  { name: 'Instagram', value: 24, color: 'oklch(0.7 0.2 340)' },
  { name: 'Web Chat', value: 18, color: 'oklch(0.74 0.18 195)' },
  { name: 'LinkedIn', value: 10, color: 'oklch(0.74 0.18 230)' },
  { name: 'Facebook', value: 6, color: 'oklch(0.72 0.19 265)' },
];

export const aiActivity = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h}:00`, replies: Math.floor(40 + Math.sin(h / 3) * 30 + Math.random() * 20),
}));

export const channelMeta: Record<Channel, { label: string; color: string; dot: string }> = {
  whatsapp: { label: 'WhatsApp', color: 'text-emerald-300', dot: 'bg-emerald-400' },
  instagram: { label: 'Instagram', color: 'text-pink-300', dot: 'bg-pink-400' },
  facebook: { label: 'Facebook', color: 'text-blue-300', dot: 'bg-blue-400' },
  linkedin: { label: 'LinkedIn', color: 'text-sky-300', dot: 'bg-sky-400' },
  web: { label: 'Web Chat', color: 'text-cyan-300', dot: 'bg-cyan-400' },
};

// ─── NEW MOCK DATA ─────────────────────────────────────────────────────────

// Voice Profiles
export const voiceProfiles = [
  {
    id: 'vp1',
    name: 'Company Voice',
    type: 'company' as const,
    description: 'Professional, warm, and trustworthy. Used for general business communication.',
    accent: 'American (Neutral)',
    speed: 'normal' as const,
    gender: 'Female',
    active: true,
  },
  {
    id: 'vp2',
    name: 'Sales Agent Voice',
    type: 'sales' as const,
    description: 'Energetic, persuasive, and confident. Optimized for sales conversions.',
    accent: 'American (Neutral)',
    speed: 'fast' as const,
    gender: 'Male',
    active: true,
  },
  {
    id: 'vp3',
    name: 'Support Agent Voice',
    type: 'support' as const,
    description: 'Calm, patient, and empathetic. Designed for customer support calls.',
    accent: 'British (Standard)',
    speed: 'slow' as const,
    gender: 'Female',
    active: false,
  },
];

// Campaigns
export const campaigns = [
  {
    id: 'cmp1',
    name: 'Summer Sale 2025',
    channel: 'whatsapp' as const,
    audience: 'All active leads (2,450 contacts)',
    message: 'Hi {{name}}! ☀️ Summer sale is here. Get 20% off on annual plans. Use code SUMMER25. Offer ends June 30.',
    status: 'completed' as const,
    sent: 2450,
    delivered: 2342,
    opened: 1876,
    clicked: 892,
    converted: 234,
    createdAt: '28 May 2025',
  },
  {
    id: 'cmp2',
    name: 'Pro Plan Launch',
    channel: 'whatsapp' as const,
    audience: 'Warm leads (1,180 contacts)',
    message: 'Hey {{name}}! We just launched our Pro Plan. Unlimited AI replies, voice calls, and priority support. Starting at $49/user.',
    status: 'sending' as const,
    sent: 845,
    delivered: 812,
    opened: 634,
    clicked: 301,
    converted: 78,
    createdAt: '29 May 2025',
  },
  {
    id: 'cmp3',
    name: 'Enterprise Webinar',
    channel: 'email' as const,
    audience: 'Enterprise leads (420 contacts)',
    message: 'Join our exclusive webinar on "AI-Powered Customer Engagement at Scale" - Featuring case studies from Vertex Retail and Helios Solar.',
    status: 'draft' as const,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    createdAt: '30 May 2025',
  },
  {
    id: 'cmp4',
    name: 'Re-engagement Campaign',
    channel: 'sms' as const,
    audience: 'Inactive leads (3 months) (680 contacts)',
    message: 'Hi {{name}}, we miss you! Come back and get a free AI consultation. Reply BOOK to schedule.',
    status: 'completed' as const,
    sent: 680,
    delivered: 658,
    opened: 412,
    clicked: 156,
    converted: 45,
    createdAt: '15 May 2025',
  },
  {
    id: 'cmp5',
    name: 'Product Update Alert',
    channel: 'whatsapp' as const,
    audience: 'Active customers (890 contacts)',
    message: 'Great news {{name}}! OmniFlow now supports voice cloning, advanced analytics, and custom workflows. Check it out!',
    status: 'draft' as const,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    createdAt: '30 May 2025',
  },
];

// Workflow Templates
export const workflowTemplates = [
  {
    id: 'wf1',
    name: 'Lead Qualification Pipeline',
    description: 'Auto-qualify leads from any channel using AI analysis and scoring.',
    active: true,
    nodes: [
      { id: 'n1', type: 'trigger' as const, label: 'New Lead Captured', description: 'Triggers when a new lead is captured', config: { channel: 'all' } },
      { id: 'n2', type: 'action' as const, label: 'Analyze Intent', description: 'Run AI analysis on incoming lead details', config: { model: 'gemini-2.5-pro' } },
      { id: 'n3', type: 'action' as const, label: 'Score Lead', description: 'Score lead against intent and engagement', config: { threshold: '70' } },
      { id: 'n4', type: 'condition' as const, label: 'Score > 70?', description: 'Route the lead using a score threshold', config: { operator: 'gt', value: '70' } },
      { id: 'n5', type: 'action' as const, label: 'Assign to Rep', description: 'Assign qualified lead to the sales team', config: { team: 'sales' } },
      { id: 'n6', type: 'action' as const, label: 'Send Follow-up', description: 'Send a follow-up message with intro details', config: { delay: '1h', template: 'intro' } },
    ],
  },
  {
    id: 'wf2',
    name: 'Demo Booking Auto-Responder',
    description: 'Detect demo interest and book appointments automatically.',
    active: false,
    nodes: [
      { id: 'n1', type: 'trigger' as const, label: 'Message Received', description: 'Triggers on any incoming message', config: { channel: 'all' } },
      { id: 'n2', type: 'action' as const, label: 'Detect Demo Intent', description: 'Analyze message for demo requests', config: { keywords: 'demo, walkthrough, show' } },
      { id: 'n3', type: 'condition' as const, label: 'Is Demo Intent?', description: 'Route based on intent detection', config: { operator: 'eq', value: 'demo' } },
      { id: 'n4', type: 'action' as const, label: 'Create Lead', description: 'Create or update lead record in CRM', config: { system: 'salesforce' } },
      { id: 'n5', type: 'action' as const, label: 'Send Calendar Link', description: 'Share available demo slots with the lead', config: { delay: '0', template: 'calendar' } },
    ],
  },
];

// Appointments
export const appointments = [
  { id: 'apt1', leadName: 'Priya Sharma', leadCompany: 'Vertex Retail', type: 'demo' as const, time: '3:00 PM', date: 'Today', duration: '30 min', status: 'scheduled' as const, assignedTo: 'Sara' },
  { id: 'apt2', leadName: 'Diego Alvarez', leadCompany: 'Solace Health', type: 'meeting' as const, time: '11:00 AM', date: 'Today', duration: '45 min', status: 'completed' as const, assignedTo: 'You' },
  { id: 'apt3', leadName: 'Sophia Chen', leadCompany: 'Northwind Logistics', type: 'call' as const, time: '2:00 PM', date: 'Tomorrow', duration: '20 min', status: 'scheduled' as const, assignedTo: 'Sara' },
  { id: 'apt4', leadName: 'Marcus Bauer', leadCompany: 'Helios Solar', type: 'demo' as const, time: '4:30 PM', date: 'Today', duration: '30 min', status: 'scheduled' as const, assignedTo: 'You' },
  { id: 'apt5', leadName: 'Camila Rossi', leadCompany: 'Aurora Cosmetics', type: 'demo' as const, time: '10:00 AM', date: 'Yesterday', duration: '30 min', status: 'completed' as const, assignedTo: 'Sara' },
  { id: 'apt6', leadName: 'Aisha Khan', leadCompany: 'Echo Studios', type: 'call' as const, time: '1:00 PM', date: 'Tomorrow', duration: '15 min', status: 'cancelled' as const, assignedTo: 'You' },
];

// Follow-up Rules
export const followUpRules = [
  { id: 'fu1', name: 'No Reply After 1 Day', trigger: 'no-reply-1d' as const, action: 'send-reminder' as const, channel: 'all' as const, active: true, fired: 342 },
  { id: 'fu2', name: 'No Reply After 3 Days', trigger: 'no-reply-3d' as const, action: 'escalate' as const, channel: 'all' as const, active: true, fired: 89 },
  { id: 'fu3', name: 'Demo Follow-up', trigger: 'demo-attended' as const, action: 'send-pricing' as const, channel: 'all' as const, active: true, fired: 156 },
  { id: 'fu4', name: 'Proposal Sent Follow-up', trigger: 'proposal-sent' as const, action: 'create-task' as const, channel: 'all' as const, active: false, fired: 42 },
];

// CRM Recommendations
export const crmRecommendations = [
  { id: 'rec1', title: 'Schedule a Demo', description: 'Priya Sharma showed high pricing intent on WhatsApp. Book a demo to close the deal.', action: 'Schedule via Calendly', priority: 'high' as const, leadName: 'Priya Sharma', leadId: 'lead-3' },
  { id: 'rec2', title: 'Send Pricing Sheet', description: 'Diego Alvarez asked about team plans. Send the enterprise pricing PDF.', action: 'Send via Email', priority: 'high' as const, leadName: 'Diego Alvarez', leadId: 'lead-5' },
  { id: 'rec3', title: 'Escalate Lead', description: 'Sophia Chen from Northwind Logistics (500+ employees). Route to enterprise team.', action: 'Assign to Enterprise', priority: 'medium' as const, leadName: 'Sophia Chen', leadId: 'lead-7' },
  { id: 'rec4', title: 'Assign Senior Agent', description: 'Marcus Bauer has a complex integration query. Assign to senior support.', action: 'Assign Agent', priority: 'medium' as const, leadName: 'Marcus Bauer', leadId: 'lead-9' },
  { id: 'rec5', title: 'Follow Up', description: 'Camila Rossi attended demo but hasn\'t responded in 3 days. Send a follow-up.', action: 'Send Reminder', priority: 'low' as const, leadName: 'Camila Rossi', leadId: 'lead-11' },
];

// Sales Predictions
export const salesPredictions = [
  { recommendedPlan: 'Pro Plan ($49/user/mo)', estimatedDealSize: 24500, conversionChance: 78, suggestedAction: 'Schedule live demo ASAP', score: 88 },
  { recommendedPlan: 'Enterprise Plan ($99/user/mo)', estimatedDealSize: 99000, conversionChance: 62, suggestedAction: 'Send ROI calculator + case study', score: 74 },
  { recommendedPlan: 'Starter Plan ($19/user/mo)', estimatedDealSize: 3800, conversionChance: 91, suggestedAction: 'Send quick start guide', score: 92 },
  { recommendedPlan: 'Pro Plan ($49/user/mo)', estimatedDealSize: 14700, conversionChance: 71, suggestedAction: 'Offer free onboarding call', score: 82 },
];

// Lead Score Breakdowns
export const leadScoreBreakdowns: Record<string, { overall: number; confidence: number; temperature: 'hot' | 'warm' | 'cold'; factors: { label: string; score: number; maxScore: number; weight: number }[]; summary: string; recommendedAction: string }> = {
  'lead-3': {
    overall: 92, confidence: 94, temperature: 'hot',
    factors: [
      { label: 'Pricing Intent', score: 95, maxScore: 100, weight: 30 },
      { label: 'Demo Requests', score: 88, maxScore: 100, weight: 25 },
      { label: 'Team Size Fit', score: 85, maxScore: 100, weight: 15 },
      { label: 'Positive Sentiment', score: 90, maxScore: 100, weight: 15 },
      { label: 'Response Frequency', score: 78, maxScore: 100, weight: 10 },
      { label: 'Engagement Level', score: 92, maxScore: 100, weight: 5 },
    ],
    summary: 'High-intent lead actively engaged in pricing discussions. Multiple touchpoints indicate strong buying signal.',
    recommendedAction: 'Schedule a product demo for Enterprise Plan',
  },
  'lead-5': {
    overall: 78, confidence: 88, temperature: 'warm',
    factors: [
      { label: 'Pricing Intent', score: 72, maxScore: 100, weight: 30 },
      { label: 'Demo Requests', score: 65, maxScore: 100, weight: 25 },
      { label: 'Team Size Fit', score: 90, maxScore: 100, weight: 15 },
      { label: 'Positive Sentiment', score: 85, maxScore: 100, weight: 15 },
      { label: 'Response Frequency', score: 60, maxScore: 100, weight: 10 },
      { label: 'Engagement Level', score: 75, maxScore: 100, weight: 5 },
    ],
    summary: 'Showed interest but needs nurturing. Large team size makes this a promising opportunity.',
    recommendedAction: 'Send pricing sheet and follow up in 2 days',
  },
};

// Sentiment Data
export const sentimentHistory = [
  { date: 'Mon', positive: 65, neutral: 25, negative: 10 },
  { date: 'Tue', positive: 72, neutral: 18, negative: 10 },
  { date: 'Wed', positive: 68, neutral: 22, negative: 10 },
  { date: 'Thu', positive: 81, neutral: 14, negative: 5 },
  { date: 'Fri', positive: 76, neutral: 16, negative: 8 },
  { date: 'Sat', positive: 70, neutral: 22, negative: 8 },
  { date: 'Sun', positive: 74, neutral: 20, negative: 6 },
];

// Workspace / Multi-Tenant
export const workspaces = [
  {
    id: 'acme-inc',
    companyName: 'Acme Inc',
    logo: 'AC',
    accentColor: 'oklch(0.74 0.18 155)',
    plan: 'enterprise' as const,
    activeUsers: 18,
    createdAt: 'Jan 2024',
    role: 'owner' as const,
    mrr: 11999,
    arr: 143988,
    growth: 18,
    members: [
      { id: 'u1', name: 'Alex Morgan', email: 'alex@acme.com', role: 'owner' as const, avatar: 'AM' },
      { id: 'u2', name: 'Sara Chen', email: 'sara@acme.com', role: 'admin' as const, avatar: 'SC' },
      { id: 'u3', name: 'Mike Johnson', email: 'mike@acme.com', role: 'agent' as const, avatar: 'MJ' },
    ],
    usage: { conversations: 12847, leads: 1284, apiCalls: 45820, storage: 256 },
    billing: { amount: 499, nextPayment: '15 Jun 2025', status: 'active' as const },
  },
  {
    id: 'techcorp',
    companyName: 'TechCorp',
    logo: 'TC',
    accentColor: 'oklch(0.68 0.22 285)',
    plan: 'pro' as const,
    activeUsers: 12,
    createdAt: 'Feb 2024',
    role: 'admin' as const,
    mrr: 7499,
    arr: 89988,
    growth: 26,
    members: [
      { id: 'u4', name: 'Priya Sharma', email: 'priya@techcorp.com', role: 'admin' as const, avatar: 'PS' },
      { id: 'u5', name: 'Raj Patel', email: 'raj@techcorp.com', role: 'agent' as const, avatar: 'RP' },
      { id: 'u6', name: 'Aisha Khan', email: 'aisha@techcorp.com', role: 'agent' as const, avatar: 'AK' },
    ],
    usage: { conversations: 9700, leads: 790, apiCalls: 76000, storage: 380 },
    billing: { amount: 499, nextPayment: '18 Jun 2025', status: 'active' as const },
  },
  {
    id: 'gradskills',
    companyName: 'GradSkills',
    logo: 'GS',
    accentColor: 'oklch(0.55 0.52 110)',
    plan: 'starter' as const,
    activeUsers: 8,
    createdAt: 'Mar 2024',
    role: 'admin' as const,
    mrr: 2999,
    arr: 35988,
    growth: 12,
    members: [
      { id: 'u7', name: 'Diego Alvarez', email: 'diego@gradskills.com', role: 'owner' as const, avatar: 'DA' },
      { id: 'u8', name: 'Mia Dubois', email: 'mia@gradskills.com', role: 'agent' as const, avatar: 'MD' },
    ],
    usage: { conversations: 4700, leads: 420, apiCalls: 24000, storage: 98 },
    billing: { amount: 99, nextPayment: '12 Jun 2025', status: 'active' as const },
  },
  {
    id: 'omniflow-demo',
    companyName: 'OmniFlow Demo',
    logo: 'OD',
    accentColor: 'oklch(0.74 0.19 195)',
    plan: 'pro' as const,
    activeUsers: 10,
    createdAt: 'Apr 2024',
    role: 'agent' as const,
    mrr: 5999,
    arr: 71988,
    growth: 21,
    members: [
      { id: 'u9', name: 'Hiro Sato', email: 'hiro@omniflow.com', role: 'admin' as const, avatar: 'HS' },
      { id: 'u10', name: 'Zara Ali', email: 'zara@omniflow.com', role: 'agent' as const, avatar: 'ZA' },
    ],
    usage: { conversations: 8100, leads: 720, apiCalls: 54000, storage: 180 },
    billing: { amount: 499, nextPayment: '22 Jun 2025', status: 'active' as const },
  },
];

function tenantIndex(tenantId: string) {
  return workspaces.findIndex((tenant) => tenant.id === tenantId) || 0;
}

function tenancySuffix(tenantId: string) {
  const tenant = workspaces.find((item) => item.id === tenantId);
  return tenant ? tenant.companyName.split(' ').map((word) => word.charAt(0)).join('') : 'TN';
}

function tenantSettings(tenantId: string) {
  const idx = tenantIndex(tenantId);
  return {
    suffix: tenancySuffix(tenantId),
    shift: idx * 5,
    accent: workspaces[idx]?.accentColor ?? 'oklch(0.74 0.18 155)',
    companyName: workspaces[idx]?.companyName ?? 'Tenant',
  };
}

function mapWithOffset<T>(items: T[], offset: number, transform: (item: T, index: number) => T): T[] {
  return items.map((item, index) => transform(items[(index + offset) % items.length], index));
}

export function getTenantDataset(tenantId: string) {
  const config = tenantSettings(tenantId);
  const leadPrefix = config.suffix.toLowerCase();

  const tenantLeads = leads.map((lead, index) => ({
    ...lead,
    id: `${tenantId}-lead-${index + 1}`,
    company: `${lead.company} ${config.companyName}`,
    email: `${lead.name.toLowerCase().replace(/[^a-z]/g, '.')}.${leadPrefix}@${tenantId}.com`,
    value: lead.value + config.shift * 10,
    aiScore: Math.min(100, lead.aiScore + (config.shift % 10)),
  }));

  const tenantConversations = conversations.map((conversation, index) => ({
    ...conversation,
    id: `${tenantId}-${conversation.id}`,
    name: `${conversation.name} (${config.companyName})`,
    lastMessage: conversation.lastMessage.replace(/OmniFlow|HubSpot|Salesforce/g, config.companyName),
    time: `${Math.max(1, Number(conversation.time.replace(/[^0-9]/g, '')) + (config.shift % 5))}m`,
    avatar: conversation.avatar,
  }));

  const tenantAppointments = appointments.map((appointment, index) => ({
    ...appointment,
    id: `${tenantId}-${appointment.id}`,
    leadCompany: `${appointment.leadCompany} ${config.companyName}`,
    assignedTo: index % 2 === 0 ? 'You' : appointment.assignedTo,
  }));

  const tenantCampaigns = campaigns.map((campaign, index) => ({
    ...campaign,
    id: `${tenantId}-${campaign.id}`,
    name: `${campaign.name} • ${config.companyName}`,
    audience: campaign.audience.replace(/(contacts)/, `${config.companyName} $1`),
    createdAt: campaign.createdAt,
  }));

  const tenantAnalytics = {
    ...{ messageVolume, leadGrowth, channelShare, aiActivity },
    totalConversations: 8000 + config.shift * 120,
    totalLeads: 720 + config.shift * 12,
    totalMessages: 24600 + config.shift * 300,
    aiHandledCount: 5600 + config.shift * 85,
    conversionRate: 28.5 + config.shift * 0.2,
    activeChannels: ['whatsapp', 'instagram', 'web'],
    avgResponseTime: 8 + (config.shift % 4),
    aiDeflectionRate: 72 + (config.shift % 10),
  };

  const tenantWorkflows = workflowTemplates.map((template, index) => {
    const nodeIdMap = template.nodes.reduce<Record<string, string>>((acc, node) => {
      acc[node.id] = `${tenantId}-${node.id}-${Math.random().toString(16).slice(2, 6)}`;
      return acc;
    }, {});

    return {
      ...template,
      id: `${tenantId}-${template.id}`,
      name: `${template.name} — ${config.companyName}`,
      createdAt: new Date(Date.now() - index * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - index * 3600000).toISOString(),
      executions: 12 + index * 7,
      successRate: 82 + (index % 4) * 4,
      nodes: template.nodes.map((node) => ({
        ...node,
        id: nodeIdMap[node.id],
      })),
      edges: template.nodes.slice(1).map((node, edgeIndex) => ({
        id: `${tenantId}-edge-${edgeIndex + 1}`,
        source: nodeIdMap[template.nodes[edgeIndex].id],
        target: nodeIdMap[node.id],
      })),
    };
  });

  const auditLog = [
    { id: `${tenantId}-audit-1`, time: 'Today 09:14', event: 'User login', details: `${config.companyName} owner signed in` },
    { id: `${tenantId}-audit-2`, time: 'Today 10:05', event: 'Lead created', details: 'New lead added from WhatsApp channel' },
    { id: `${tenantId}-audit-3`, time: 'Today 11:22', event: 'Campaign sent', details: 'Promotional broadcast sent to 420 contacts' },
    { id: `${tenantId}-audit-4`, time: 'Today 12:48', event: 'Workflow executed', details: 'Demo booking automation completed successfully' },
  ];

  return {
    leads: tenantLeads,
    conversations: tenantConversations,
    appointments: tenantAppointments,
    campaigns: tenantCampaigns,
    analytics: tenantAnalytics,
    workflows: tenantWorkflows,
    auditLog,
  };
}

export function getWorkflowTemplatesForTenant(tenantId: string) {
  const tenant = workspaces.find((item) => item.id === tenantId);
  const prefix = tenant ? `${tenant.companyName} AI` : 'Tenant AI';
  return workflowTemplates.map((template, index) => ({
    ...template,
    id: `${tenantId}-${template.id}`,
    name: `${template.name} · ${prefix}`,
    description: `${template.description} for ${tenant?.companyName ?? 'Tenant'}`,
    active: template.active,
  }));
}

export const tenants = workspaces;

// Revenue data for forecast
export const revenueForecast = [
  { month: 'Jan', actual: 32000, forecast: 32000 },
  { month: 'Feb', actual: 38000, forecast: 35000 },
  { month: 'Mar', actual: 42000, forecast: 40000 },
  { month: 'Apr', actual: 48000, forecast: 45000 },
  { month: 'May', actual: 55000, forecast: 50000 },
  { month: 'Jun', actual: null, forecast: 62000 },
  { month: 'Jul', actual: null, forecast: 68000 },
];

// Agent performance data
export const agentPerformance = [
  { name: 'Alex Morgan', conversations: 412, resolved: 378, satisfaction: 4.9, avgTime: '2m 14s' },
  { name: 'Sara Chen', conversations: 385, resolved: 351, satisfaction: 4.8, avgTime: '2m 42s' },
  { name: 'Mike Johnson', conversations: 298, resolved: 265, satisfaction: 4.6, avgTime: '3m 08s' },
  { name: 'Lisa Park', conversations: 156, resolved: 142, satisfaction: 4.7, avgTime: '2m 56s' },
];

// Lead funnel data
export const leadFunnel = [
  { stage: 'Captured', count: 1284 },
  { stage: 'Contacted', count: 892 },
  { stage: 'Qualified', count: 534 },
  { stage: 'Proposal', count: 267 },
  { stage: 'Negotiation', count: 145 },
  { stage: 'Closed Won', count: 82 },
];
