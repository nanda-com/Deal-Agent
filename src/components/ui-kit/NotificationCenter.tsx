import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/contexts/NotificationsContext';
import { NotificationItem } from '@/components/ui-kit/NotificationItem';

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAllRead,
    clearAll,
    openNotification,
  } = useNotifications();

  const handleClick = (notification: (typeof notifications)[number]) => {
    setOpen(false);
    openNotification(notification);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-xl bg-[#0f172a] text-white hover:bg-white/6 transition"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-pink-500 text-[10px] font-bold text-white grid place-items-center notif-dot">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', damping: 24 }}
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#0f172a] text-white rounded-[16px] overflow-hidden shadow-2xl z-[41]"
            >
              <div className="p-4 border-b border-border/60 flex items-center justify-between">
                <h3 className="font-semibold text-sm">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      ({unreadCount} unread)
                    </span>
                  )}
                </h3>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-accent hover:underline">
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-muted-foreground hover:text-foreground"
                      title="Clear all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-300">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <NotificationItem
                      key={notif.id}
                      notification={notif}
                      onClick={handleClick}
                    />
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 border-t border-border/60 text-center">
                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate('/notifications');
                    }}
                    className={cn(
                      'text-xs text-muted-foreground hover:text-foreground transition',
                      'px-3 py-1.5 rounded-lg hover:bg-white/5',
                    )}
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
