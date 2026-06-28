import type {
  Conversation, Message, Lead, Automation, WorkspaceSettings, CallLog, Channel, FirebaseTimestamp, VoiceProfile,
} from '../types/index.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rng(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number): FirebaseTimestamp {
  return { _seconds: Math.floor(Date.now() / 1000) - days * 86400, _nanoseconds: 0 };
}

function timeStr(ts: FirebaseTimestamp): string {
  return new Date(ts._seconds * 1000).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function dateStr(ts: FirebaseTimestamp): string {
  return new Date(ts._seconds * 1000).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function id(prefix: string, n: number): string {
  return prefix + '-' + String(n).padStart(3, '0');
}

function sanitizeEmail(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NAMES: readonly string[] = [
  'Aarav Mehta', 'Priya Sharma', 'Diego Alvarez', 'Sophia Chen', "Liam O'Connor",
  'Aisha Khan', 'Noah Williams', 'Yuki Tanaka', 'Emma Johansson', 'Marcus Bauer',
  'Layla Hassan', 'Oliver Smith', 'Camila Rossi', 'Hiro Sato', 'Mia Dubois',
  'Ethan Park', 'Zara Ali', 'Lucas Silva', 'Nora Lindqvist', 'Ravi Iyer',
  'Chloe Martin', 'Omar Farouk', 'Isabella Romano', 'Kenji Watanabe', 'Ana Costa',
  'Felix Hoffmann', 'Mei Lin', 'James Wilson', 'Fatima Al-Rashid', 'Arjun Kapoor',
  'Elena Petrova', 'David Kim', 'Sarah Mitchell', 'Hassan Syed', 'Maria Gonzalez',
  'Thomas Baker', 'Aiko Yamamoto', "Ryan O'Brien", 'Leila Benali', 'Vikram Patel',
  'Grace Thompson', 'Carlos Mendez', 'Hannah Schmidt', 'Rahul Verma', 'Olivia Brown',
  'Alice Dubois', 'Luca Moretti', 'Sakura Tanaka', 'Isla Anderson', 'Oscar Nielsen',
];

const COMPANIES: readonly string[] = [
  'Nimbus Labs', 'Vertex Retail', 'Solace Health', 'Northwind Logistics',
  'Echo Studios', 'Pioneer Bank', 'Quantum EdTech', 'Helios Solar',
  'Aurora Cosmetics', 'BrightPath Realty', 'Polaris Travel', 'Cobalt Fitness',
  'Atlas Manufacturing', 'Riverbed Analytics', 'Summit Security', 'Driftwood Media',
  'Ironclad Insurance', 'Meridian Health', 'Stonebridge Capital', 'Prairie Agritech',
  'Cascade Robotics', 'Titan Construction', 'Ember Creative', 'Lumen Energy',
  'Horizon Ventures',
];

const CHANNELS: readonly Channel[] = ['whatsapp', 'instagram', 'facebook', 'linkedin', 'web'];
const PRIORITIES: readonly ('hot' | 'warm' | 'cold')[] = ['hot', 'warm', 'cold'];
const STATUSES: readonly ('new' | 'qualified' | 'contacted' | 'converted' | 'lost')[] = ['new', 'qualified', 'contacted', 'converted', 'lost'];
const CALL_OUTCOMES: readonly string[] = ['Completed', 'Demo booked', 'Quote sent', 'Voicemail', 'No answer', 'Call back later'];
const ASSIGNEES: readonly (string | undefined)[] = ['You', 'Sara', 'Mike', 'Priya', 'Alex', undefined];
const EMAIL_DOMAINS: readonly string[] = ['gmail.com', 'outlook.com', 'company.com', 'proton.me', 'icloud.com'];
const NOTES: readonly string[] = [
  'Met at Web Summit — interested in enterprise plan.',
  'Referred by existing customer.',
  'Requested pricing via website.',
  'Following up from LinkedIn outreach campaign.',
  'Attended product webinar.',
  'Cold inbound from Instagram ad.',
  'Partner referral.',
  'Previous customer returning.',
  '',
];

const DIALOGUES: Record<Channel, readonly string[]> = {
  whatsapp: [
    'Hi, do you ship internationally?',
    'Can I get a demo this week?',
    "What's your pricing for the Pro plan?",
    'Do you support Shopify integration?',
    'How fast is delivery?',
    'Can you send me a brochure?',
    'I need support with my order.',
    'What payment methods do you accept?',
    'Is there a discount for annual billing?',
    'Can I speak to a human agent?',
  ],
  instagram: [
    "Love your content! How do I sign up?",
    'Is this available for small businesses?',
    'Can you DM me pricing details?',
    'Do you work with influencers?',
    'This looks amazing! 🤩',
    'Team of 10 — what plan?',
    'Is there a free trial?',
    'Your post was super helpful!',
    'How long does onboarding take?',
    'Do you have a mobile app?',
  ],
  facebook: [
    'Hi, I have a question about your product.',
    'How does this compare to competitors?',
    'Is there any setup fee?',
    'Can I cancel anytime?',
    'Do you offer 24/7 support?',
    'Can multiple team members use it?',
    'Do you integrate with Salesforce?',
    'What kind of reporting do you have?',
    'Is the data secure?',
    'Can I import my existing contacts?',
  ],
  linkedin: [
    "I'd like to discuss a partnership.",
    'Interested for our 200+ sales team.',
    'Tell me about enterprise compliance.',
    'Schedule a demo for my leadership team.',
    'Need a unified communication solution.',
    'Do you have a white-label option?',
    'What is your data residency policy?',
    'Can we integrate with our CRM?',
    'Do you support SSO/SAML?',
    'What SLAs do you offer?',
  ],
  web: [
    'Hello! How do I get started?',
    'I have a billing question.',
    'Can I change my plan later?',
    'What happens after the free trial?',
    'Do you have tutorials?',
    'How do I add team members?',
    'Can I export my data?',
    'Is there a message limit?',
    'Do you offer onboarding support?',
    'I ran into an error. Help!',
  ],
};

const AI_REPLIES: Record<Channel, readonly string[]> = {
  whatsapp: [
    'Absolutely, we ship to 80+ countries with tracking!',
    'I have blocked Thursday 3pm IST — calendar invite incoming!',
    'Pro plan starts at $49/user/month with all channels included.',
    'Yes! Native Shopify integration in under 5 minutes.',
    'Standard delivery is 3-5 business days. Express available.',
    'I will email our latest brochure right away.',
    'Let me look up your order. Please share your email.',
    'We accept all major credit cards, PayPal, and bank transfers.',
    'Yes! Annual plans come with 20% discount.',
    'Of course! Let me transfer you to a team member.',
  ],
  instagram: [
    'So glad you love it! Sign up in under 60 seconds 🚀',
    'Absolutely! Plans start at $29/month for teams of 5.',
    'Coming right up — check your message requests!',
    'Yes! We have a Creator plan for influencers.',
    'Glad you like it! Ready to get started today? 🎉',
    'With 10 users, Pro plan at $49/user/month is ideal.',
    'Yes! 14-day free trial with full access.',
    'Thank you! Would you like a personalised walkthrough?',
    'Most teams are up and running within an hour!',
    'Yes! iOS and Android apps are available.',
  ],
  facebook: [
    'Hello! Happy to answer any questions!',
    'We differentiate with AI-powered automation across channels.',
    'No setup fees at all — transparent pricing.',
    'Absolutely! Cancel anytime with no penalties.',
    'Yes! AI support 24/7, human support 9am-7pm IST.',
    'Yes! Unlimited team members with role-based permissions.',
    'Native Salesforce integration with bi-directional sync.',
    'Real-time dashboards with message volume and conversion tracking.',
    'Enterprise-grade security with SOC 2 compliance.',
    'Yes! CSV and API imports supported.',
  ],
  linkedin: [
    'Thank you! Let me share our partner deck.',
    'Enterprise plan would be best for 200+ users.',
    'SOC 2 Type II certified, GDPR compliant.',
    'I will arrange a demo for your leadership team.',
    'One inbox for WhatsApp, Instagram, LinkedIn, Web Chat!',
    'Yes, white-label options available for enterprise.',
    'Data residency in US, EU (Frankfurt), and APAC (Singapore).',
    'Native integrations with Salesforce, HubSpot, Zoho + REST API.',
    'Yes! SAML 2.0, SSO, SCIM provisioning supported.',
    'We offer 99.9% uptime SLA with enterprise plans.',
  ],
  web: [
    'Hi there! Sign up and get onboarded in minutes!',
    'Sure! What billing question can I help with?',
    'Yes! Upgrade or downgrade anytime.',
    'After trial, your plan continues. No surprises!',
    'We have a growing library of video tutorials!',
    'Go to Settings to invite team members.',
    'Yes! Export all data as CSV or JSON anytime.',
    'Message limits depend on plan — up to unlimited on Enterprise.',
    'We offer personalised onboarding for all new customers.',
    'Let me help troubleshoot — can you share the error message?',
  ],
};

const AI_SUMMARIES: readonly string[] = [
  'Customer interested in pricing for 20-person team. Requested demo.',
  'Discussed WhatsApp integration requirements. Will follow up after internal review.',
  'General product inquiry. Lead is in early research stage.',
  'Existing customer calling about platform migration support.',
  'Technical support call — resolved authentication issue.',
  'Billing inquiry — discussed annual plan discount options.',
];

const CALL_TRANSCRIPTS: Record<string, readonly string[]> = {
  'Demo booked': [
    "Hi, I was calling about your product. How does pricing work?",
    "Thanks for reaching out! Our pricing starts at $29 per user per month.",
    "Around 20 people. We need WhatsApp and Instagram channels.",
    "Perfect, the Growth plan at $49/user/month includes all channels.",
    "Yes, let us book a demo for next week.",
    "Great! I will send a calendar invite right away.",
  ],
  'Completed': [
    "Hi, I need some help with your platform.",
    "Of course! What issue are you facing?",
    "I can't figure out how to connect Instagram.",
    "Let me walk you through it. First go to Settings.",
    "Oh I see it now! That was easy.",
    "Glad I could help! Reach out anytime.",
  ],
  'Quote sent': [
    "Hi, I want a quote for my team of 50.",
    "Certainly! I will prepare a custom quote for 50 users.",
    "Do you offer a discount for non-profit?",
    "Yes, we offer 30% discount for verified non-profits.",
    "Great, please send the quote to my email.",
    "Sent! You should receive it within 5 minutes.",
  ],
  'Voicemail': [],
  'No answer': [],
  'Call back later': [
    "Hi, is this a good time to discuss OmniFlow?",
    "Sorry, I'm in a meeting. Can you call back later?",
    "Sure! I will call back at 3pm. Does that work?",
    "Yes, 3pm works. I will be free then.",
    "Perfect, talk to you at 3pm!",
    "Looking forward to it!",
  ],
};

// ─── Interface ──────────────────────────────────────────────────────────────

export interface SeedData {
  conversations: Map<string, Conversation>;
  messages: Map<string, Message[]>;
  leads: Map<string, Lead>;
  automations: Map<string, Automation>;
  settings: Record<string, WorkspaceSettings>;
  callLogs: Map<string, CallLog>;
  voiceProfiles?: VoiceProfile[];
}

// ─── Main Generator ─────────────────────────────────────────────────────────

export function generateSeedData(): SeedData {
  const conversations = new Map<string, Conversation>();
  const messages = new Map<string, Message[]>();
  const leads = new Map<string, Lead>();
  const automations = new Map<string, Automation>();
  const callLogs = new Map<string, CallLog>();

  // ── Generate 50 Leads ───────────────────────────────────────────────────
  for (let i = 0; i < 50; i++) {
    const name = NAMES[i];
    const company = COMPANIES[i % COMPANIES.length];
    const channel = CHANNELS[i % CHANNELS.length];
    const status = STATUSES[i % STATUSES.length];
    const priority = PRIORITIES[i % PRIORITIES.length];
    const email = sanitizeEmail(name) + '@' + EMAIL_DOMAINS[i % EMAIL_DOMAINS.length];
    const phone = '+1-555-' + String(1000 + i).slice(1) + '-' + String(1000 + rng(0, 9999)).slice(1);
    const leadId = id('lead', i + 1);

    const leadCreated = daysAgo(rng(1, 90));
    const lead: Lead = {
      id: leadId, name, company, email, phone, channel,
      priority, status,
      value: rng(5000, 150000),
      aiScore: rng(20, 98),
      notes: NOTES[i % NOTES.length],
      createdAt: dateStr(leadCreated),
      updatedAt: daysAgo(rng(0, 5)),
    };
    leads.set(leadId, lead);

    // ── Generate 2 conversations per lead (100 total) ──────────────────────
    for (let convIdx = 0; convIdx < 2; convIdx++) {
      const convoId = id('conv', i * 2 + convIdx + 1);
      const convoChannel = CHANNELS[(i + convIdx) % CHANNELS.length];
      const dialogues = DIALOGUES[convoChannel];
      const aiReplies = AI_REPLIES[convoChannel];
      const convoCreated = daysAgo(rng(1, 60));

      const convMsgs: Message[] = [];
      const numMsgs = rng(2, 6);
      for (let m = 0; m < numMsgs; m++) {
        const isUser = m % 2 === 0;
        const msgTs = { _seconds: convoCreated._seconds + m * rng(600, 3600), _nanoseconds: 0 };
        convMsgs.push({
          id: id('msg', i * 20 + convIdx * 10 + m + 1),
          conversationId: convoId,
          from: isUser ? 'user' as const : 'ai' as const,
          text: isUser ? dialogues[m % dialogues.length] : aiReplies[m % aiReplies.length],
          time: timeStr(msgTs),
          createdAt: msgTs,
        });
      }
      const lastMsg = convMsgs[convMsgs.length - 1];
      const conv: Conversation = {
        id: convoId, name,
        avatar: name.split(' ').map((p) => p[0]).join('').toUpperCase(),
        channel: convoChannel, lastMessage: lastMsg.text,
        time: timeStr(lastMsg.createdAt ?? convoCreated),
        unread: rng(0, 5), aiHandled: lastMsg.from === 'ai',
        assignee: ASSIGNEES[(i + convIdx) % ASSIGNEES.length],
        messages: convMsgs,
        createdAt: convoCreated, updatedAt: lastMsg.createdAt ?? convoCreated,
      };
      conversations.set(convoId, conv);
      messages.set(convoId, convMsgs);
    }

    // ── Generate Call Log for every 3rd lead ───────────────────────────────
    if ((i + 1) % 3 === 0) {
      const callTs = daysAgo(rng(1, 14));
      const outcome = CALL_OUTCOMES[i % CALL_OUTCOMES.length];
      const duration = outcome === 'Voicemail' || outcome === 'No answer' ? rng(15, 60) : rng(120, 900);
      const transcriptLines = CALL_TRANSCRIPTS[outcome] ?? CALL_TRANSCRIPTS['Completed'];

      const callLog: CallLog = {
        id: id('call', Math.floor(i / 3) + 1),
        callerName: name,
        callerNumber: '+1-555-CONNECT',
        duration,
        outcome,
        transcript: transcriptLines.map((line, li) =>
          li % 2 === 0 ? `${name.split(' ')[0]}: ${line}` : `Agent: ${line}`
        ).join('\n'),
        aiSummary: AI_SUMMARIES[i % AI_SUMMARIES.length],
        leadId: id('lead', i + 1),
        timestamp: callTs,
      };
      callLogs.set(id('call', Math.floor(i / 3) + 1), callLog);
    }
  }

  // ── Generate Automations ─────────────────────────────────────────────────
  const AUTO_DATA: { name: string; trigger: string; action: string; channel: string; active: boolean; fired: number }[] = [
    { name: 'Welcome Message', trigger: 'New conversation', action: 'Send welcome template', channel: 'whatsapp', active: true, fired: 342 },
    { name: 'Lead Scoring', trigger: 'Lead created', action: 'Score with AI and assign priority', channel: 'all', active: true, fired: 189 },
    { name: 'Abandoned Checkout', trigger: 'Cart abandoned 1h', action: 'Follow-up message with discount code', channel: 'web', active: true, fired: 76 },
    { name: 'Instagram DM Reply', trigger: 'Keyword detected', action: 'Send pricing card', channel: 'instagram', active: true, fired: 234 },
    { name: 'Meeting Scheduler', trigger: 'Demo requested', action: 'Send Calendly link', channel: 'all', active: true, fired: 112 },
    { name: 'Follow-up Reminder', trigger: 'No reply 24h', action: 'Send gentle nudge', channel: 'all', active: true, fired: 567 },
    { name: 'Facebook Auto-Reply', trigger: 'After-hours query', action: 'AI auto-response with SLA', channel: 'facebook', active: false, fired: 23 },
    { name: 'LinkedIn Connect', trigger: 'New LinkedIn lead', action: 'Send connection request + note', channel: 'linkedin', active: true, fired: 45 },
  ];

  for (let a = 0; a < AUTO_DATA.length; a++) {
    const ad = AUTO_DATA[a];
    const autoId = id('auto', a + 1);
    const createdAt = daysAgo(rng(30, 120));
    const automation: Automation = {
      id: autoId, name: ad.name, trigger: ad.trigger, action: ad.action,
      channel: ad.channel as Channel | 'all', active: ad.active, fired: ad.fired,
      createdAt, updatedAt: createdAt,
    };
    automations.set(autoId, automation);
  }

  // ── Settings ─────────────────────────────────────────────────────────────
  const settings: Record<string, WorkspaceSettings> = {
    default: {
      workspaceName: 'OmniFlow AI Workspace',
      timezone: 'Asia/Kolkata (IST)',
      businessHours: '9:00 to 19:00',
      defaultLanguage: 'English',
      aiPersona: 'You are Nova, the friendly AI assistant. Be concise, warm and proactive.',
      aiModel: 'gemini-2.0-flash',
      channels: { whatsapp: true, instagram: true, facebook: true, linkedin: true, web: true },
      integrations: [],
    },
  };

  return { conversations, messages, leads, automations, settings, callLogs };
}
