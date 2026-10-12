import React, { useState } from 'react';
import {
  Bell,
  Mail,
  Check,
  CheckCheck,
  Clock,
  Sparkles,
  Users2,
  Calendar,
  CreditCard,
  AlertTriangle,
  Info,
  ExternalLink,
} from 'lucide-react';
import { InAppNotification, NotificationType } from '../types/database';
import { markNotificationRead, markAllNotificationsRead } from '../services/saasService';

interface NotificationCenterProps {
  notifications: InAppNotification[];
  instituteId: string;
  onNotificationRead: (id: string) => void;
  onAllRead: () => void;
  onNavigate?: (tab: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  instituteId,
  onNotificationRead,
  onAllRead,
  onNavigate,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const displayList = activeFilter === 'UNREAD' ? notifications.filter((n) => !n.is_read) : notifications;

  const handleMarkAsRead = async (id: string) => {
    await markNotificationRead(id);
    onNotificationRead(id);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(instituteId);
    onAllRead();
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'TIMETABLE_PUBLISHED':
        return <Calendar className="h-4 w-4 text-emerald-400" />;
      case 'FACULTY_ASSIGNMENT':
        return <Users2 className="h-4 w-4 text-indigo-400" />;
      case 'INVITATION_ACCEPTED':
      case 'INVITATION_SENT':
        return <Mail className="h-4 w-4 text-cyan-400" />;
      case 'SUBSCRIPTION_EXPIRING':
        return <CreditCard className="h-4 w-4 text-amber-400" />;
      case 'CONFLICT_DETECTED':
        return <AlertTriangle className="h-4 w-4 text-rose-400" />;
      default:
        return <Info className="h-4 w-4 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Bell className="h-6 w-6 text-[#4F46E5]" />
              Multi-Channel Notification Dispatcher
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500 text-white">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Real-time in-app alerts and transactional email notifications for timetable events, assignments, and invitations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-white/[0.08] flex items-center gap-1.5 transition-all"
            >
              <CheckCheck className="h-3.5 w-3.5 text-indigo-400" />
              <span>Mark All as Read</span>
            </button>
          )}

          <div className="p-1 bg-zinc-900 border border-white/[0.08] rounded-xl text-xs flex items-center">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'ALL' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('UNREAD')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'UNREAD' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>
      </div>

      {/* Notification Stream */}
      <div className="space-y-3">
        {displayList.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-2">
            <Bell className="h-8 w-8 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-300">All caught up!</h3>
            <p className="text-xs text-zinc-500">No unread notifications at this time.</p>
          </div>
        ) : (
          displayList.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                notif.is_read
                  ? 'bg-zinc-900/40 border-white/[0.04] opacity-80'
                  : 'bg-zinc-900/90 border-indigo-500/30 shadow-md ring-1 ring-indigo-500/10'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-zinc-800/80 border border-white/[0.08] mt-0.5">
                  {getNotificationIcon(notif.notification_type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white">{notif.title}</h3>
                    {!notif.is_read && (
                      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                    )}
                    <span className="text-[10px] font-mono text-zinc-500">
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">{notif.message}</p>

                  <div className="flex items-center gap-3 pt-1 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Mail className="h-3 w-3 text-emerald-400" />
                      Email Status: <strong className="text-zinc-300">{notif.email_delivery_status}</strong>
                    </span>

                    {notif.action_url && onNavigate && (
                      <button
                        onClick={() => {
                          if (notif.action_url?.includes('timetable')) onNavigate('clash-engine');
                          if (notif.action_url?.includes('faculty')) onNavigate('faculty');
                          if (notif.action_url?.includes('subscription')) onNavigate('subscription');
                        }}
                        className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                      >
                        <span>View Resource</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {!notif.is_read && (
                <button
                  onClick={() => handleMarkAsRead(notif.id)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all shrink-0"
                  title="Mark as read"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
