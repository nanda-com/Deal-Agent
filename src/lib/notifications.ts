export type NotificationCategory = 'message' | 'ai' | 'lead' | 'voice';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  createdAt: number;
  read: boolean;
  targetId: string;
  targetName?: string;
}

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  message: 'Messages',
  ai: 'AI Events',
  lead: 'Leads',
  voice: 'Voice Calls',
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTime(timestamp: number): string {
  const elapsed = Date.now() - timestamp;
  if (elapsed < MINUTE) return 'Just now';
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
  if (elapsed < DAY * 7) return `${Math.floor(elapsed / DAY)}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getNotificationRoute(notification: AppNotification): string {
  const nameQuery = notification.targetName
    ? `&name=${encodeURIComponent(notification.targetName)}`
    : '';

  switch (notification.category) {
    case 'message':
      return `/inbox?conversation=${encodeURIComponent(notification.targetId)}${nameQuery}`;
    case 'ai':
      return `/inbox?conversation=${encodeURIComponent(notification.targetId)}&highlight=ai${nameQuery}`;
    case 'lead':
      return `/leads?id=${encodeURIComponent(notification.targetId)}${nameQuery}`;
    case 'voice':
      return `/voice?call=${encodeURIComponent(notification.targetId)}${nameQuery}`;
    default:
      return '/notifications';
  }
}

export const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    category: 'message',
    title: 'New Messages',
    description: '3 new WhatsApp messages',
    createdAt: Date.now() - 2 * MINUTE,
    read: false,
    targetId: 'conv-5',
    targetName: 'Noah Williams',
  },
  {
    id: 'n2',
    category: 'ai',
    title: 'AI Replies Generated',
    description: '2 AI replies sent on Instagram',
    createdAt: Date.now() - 10 * MINUTE,
    read: false,
    targetId: 'conv-1',
    targetName: 'Aarav Mehta',
  },
  {
    id: 'n3',
    category: 'lead',
    title: 'New Lead Added',
    description: 'Camila Rossi via LinkedIn',
    createdAt: Date.now() - 25 * MINUTE,
    read: false,
    targetId: 'lead-10',
    targetName: 'Camila Rossi',
  },
  {
    id: 'n4',
    category: 'voice',
    title: 'Voice Call Summary',
    description: 'Call with Priya Sharma completed',
    createdAt: Date.now() - HOUR,
    read: false,
    targetId: 'call-fallback-1',
    targetName: 'Priya Sharma',
  },
  {
    id: 'n5',
    category: 'message',
    title: 'Response Pending',
    description: 'Facebook enquiry awaiting reply',
    createdAt: Date.now() - 2 * HOUR,
    read: true,
    targetId: 'conv-3',
    targetName: 'Diego Alvarez',
  },
];
