import { motion } from 'framer-motion';
import { MessagesSquare, Sparkles, Users, PhoneCall } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRelativeTime } from '@/hooks/useRelativeTime';
import {
  CATEGORY_LABELS,
  type AppNotification,
  type NotificationCategory,
} from '@/lib/notifications';

const ICON_MAP: Record<NotificationCategory, typeof MessagesSquare> = {
  message: MessagesSquare,
  ai: Sparkles,
  lead: Users,
  voice: PhoneCall,
};

interface NotificationItemProps {
  notification: AppNotification;
  onClick: (notification: AppNotification) => void;
  compact?: boolean;
}

export function NotificationItem({ notification, onClick, compact = false }: NotificationItemProps) {
  const Icon = ICON_MAP[notification.category];
  const relativeTime = useRelativeTime(notification.createdAt);
  const categoryLabel = CATEGORY_LABELS[notification.category];

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(notification)}
      className={cn(
        'w-full text-left flex items-start gap-3 px-4 py-3 transition-all duration-150 cursor-pointer',
        'hover:bg-white/10 active:bg-white/12',
        notification.read ? 'opacity-70 bg-transparent' : 'bg-white/6',
        compact && 'rounded-xl',
      )}
    >
      <div
        className={cn(
          'w-9 h-9 rounded-xl grid place-items-center shrink-0 transition-colors',
          notification.read ? 'bg-white/6 text-slate-300' : 'grad-primary',
        )}
      >
        <Icon className={cn('w-4 h-4', notification.read ? 'text-slate-300' : 'text-white')} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {categoryLabel}
          </span>
          {!notification.read && (
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />
          )}
        </div>
        <div className="text-sm font-medium text-white">{notification.title}</div>
        <div className="text-xs text-slate-300 truncate">{notification.description}</div>
        <div className="text-[10px] text-slate-400 mt-0.5 tabular-nums">{relativeTime}</div>
      </div>
    </motion.button>
  );
}
