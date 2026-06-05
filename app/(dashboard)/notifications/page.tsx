'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/app/actions/notifications';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Mail, Smartphone, MessageSquare } from 'lucide-react';

const channelIcons: Record<string, any> = {
  push: Bell,
  email: Mail,
  sms: MessageSquare,
};

const topicLabels: Record<string, string> = {
  purchase: 'Покупка билета',
  status_change: 'Изменение статуса',
  reminder: 'Напоминание',
  bonus_accrual: 'Начисление баллов',
  bonus_write_off: 'Списание баллов',
  level_change: 'Изменение уровня',
  refund: 'Возврат',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const data = await getNotifications(50);
      setNotifications(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleMarkRead(id: string) {
    await markNotificationAsRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  async function handleMarkAllRead() {
    await markAllNotificationsAsRead();
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Уведомления</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0
              ? `${unreadCount} непрочитанных уведомлений`
              : 'Нет непрочитанных уведомлений'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Прочитать все
          </Button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notification: any) => {
            const ChannelIcon = channelIcons[notification.channel] || Bell;

            return (
              <div
                key={notification.id}
                className={`bg-white rounded-lg border p-4 transition-colors ${
                  notification.read
                    ? 'border-gray-200'
                    : 'border-red-200 bg-red-50/50'
                }`}
                onClick={() => !notification.read && handleMarkRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    notification.read ? 'bg-gray-100' : 'bg-red-100'
                  }`}>
                    <ChannelIcon className={`w-5 h-5 ${
                      notification.read ? 'text-gray-400' : 'text-red-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm font-medium ${
                          notification.read ? 'text-gray-700' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">
                        {new Date(notification.created_at).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">
                        {topicLabels[notification.topic] || notification.topic}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Нет уведомлений</p>
          <p className="text-sm text-gray-400 mt-1">
            Уведомления о событиях будут отображаться здесь
          </p>
        </div>
      )}
    </div>
  );
}