import { useMemo, useState } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { GlassCard, Badge } from '@/components/ui-kit/Card';
import { NotificationItem } from '@/components/ui-kit/NotificationItem';
import { useNotifications } from '@/contexts/NotificationsContext';
import { CATEGORY_LABELS, type NotificationCategory } from '@/lib/notifications';

type FilterOption = 'all' | 'unread' | NotificationCategory;

export function NotificationsPage() {
  const [filter, setFilter] = useState<FilterOption>('all');
  const {
    notifications,
    unreadCount,
    markAllRead,
    clearAll,
    openNotification,
  } = useNotifications();

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    return notifications.filter((n) => n.category === filter);
  }, [notifications, filter]);

  const filterOptions: { value: FilterOption; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: `Unread (${unreadCount})` },
    { value: 'message', label: CATEGORY_LABELS.message },
    { value: 'ai', label: CATEGORY_LABELS.ai },
    { value: 'lead', label: CATEGORY_LABELS.lead },
    { value: 'voice', label: CATEGORY_LABELS.voice },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay on top of messages, leads, AI activity, and voice calls
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="h-10 px-4 rounded-xl glass hover:bg-white/10 text-sm flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="h-10 px-4 rounded-xl glass hover:bg-white/10 text-sm flex items-center gap-2 text-muted-foreground"
            >
              <Trash2 className="w-4 h-4" /> Clear all
            </button>
          )}
        </div>
      </div>

      <GlassCard className="p-4">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-3 h-9 rounded-xl text-xs font-medium transition ${
                filter === option.value ? 'grad-primary text-white' : 'glass hover:bg-white/10'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications to show'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={openNotification}
                compact
              />
            ))}
          </div>
        )}
      </GlassCard>

      {unreadCount > 0 && (
        <div className="flex justify-center">
          <Badge tone="primary">{unreadCount} unread</Badge>
        </div>
      )}
    </div>
  );
}
