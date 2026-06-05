'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getTripHistory } from '@/app/actions/tickets';
import { getBonusAccount, getBonusTransactions } from '@/app/actions/bonus';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/app/actions/notifications';
import { getLinkedCards, getSubscriptions } from '@/app/actions/profile';
import { getNotificationSettings } from '@/app/actions/notifications';
import { TicketCard } from '@/components/tickets/ticket-card';
import { AnalyticsDashboard } from '@/components/dashboard/analytics-dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import {
  Ticket,
  CalendarCheck,
  Gift,
  History,
  Bell,
  User,
  Search,
  ArrowRight,
  TrendingUp,
  Award,
  Plus,
  Calculator,
  ArrowUp,
  ArrowDown,
  CheckCheck,
  Mail,
  Smartphone,
  MessageSquare,
  CreditCard,
  Trash2,
  Lock,
  Phone,
  Calendar,
  Train,
  Filter,
  Download,
  SearchX,
} from 'lucide-react';
import { TicketWithDetails, WAGON_CATEGORIES, BONUS_LEVELS } from '@/lib/types';

type TabId = 'tickets' | 'bookings' | 'bonus' | 'history' | 'notifications' | 'profile';

const tabs: { id: TabId; label: string; icon: any }[] = [
  { id: 'tickets', label: 'Билеты', icon: Ticket },
  { id: 'bookings', label: 'Бронирования', icon: CalendarCheck },
  { id: 'bonus', label: 'РЖД Бонус', icon: Gift },
  { id: 'history', label: 'История поездок', icon: History },
  { id: 'notifications', label: 'Уведомления', icon: Bell },
  { id: 'profile', label: 'Профиль', icon: User },
];

const topicLabels: Record<string, string> = {
  purchase: 'Покупка билета',
  status_change: 'Изменение статуса билета',
  reminder: 'Напоминание о поездке',
  bonus_accrual: 'Начисление баллов',
  bonus_write_off: 'Списание баллов',
  level_change: 'Изменение уровня',
  refund: 'Возврат',
};

const channelLabels: Record<string, string> = {
  push: 'Push-уведомления',
  email: 'Email',
  sms: 'SMS',
};

const channelIcons: Record<string, any> = {
  push: Bell,
  email: Mail,
  sms: MessageSquare,
};

const subscriptionLabels: Record<string, string> = {
  newsletter: 'Новостная рассылка',
  promotions: 'Акции и спецпредложения',
  survey: 'Опросы и исследования',
};

export default function CabinetPage() {
  const [activeTab, setActiveTab] = useState<TabId>('tickets');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tickets state
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsSearch, setTicketsSearch] = useState('');
  const [ticketsFilter, setTicketsFilter] = useState<'all' | 'active' | 'past'>('all');

  // Bookings state
  const [bookings, setBookings] = useState<any[]>([]);

  // Bonus state
  const [bonusAccount, setBonusAccount] = useState<any>(null);
  const [bonusTransactions, setBonusTransactions] = useState<any[]>([]);

  // History state
  const [historyTickets, setHistoryTickets] = useState<any[]>([]);
  const [historyPeriod, setHistoryPeriod] = useState('');
  const [historyTrainNumber, setHistoryTrainNumber] = useState('');
  const [historyWagonCategory, setHistoryWagonCategory] = useState('');
  const [showHistoryFilters, setShowHistoryFilters] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);

  // Profile state
  const [profileFullName, setProfileFullName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileBirthDate, setProfileBirthDate] = useState('');
  const [profileCards, setProfileCards] = useState<any[]>([]);
  const [profileSubscriptions, setProfileSubscriptions] = useState<any[]>([]);
  const [profileNotificationSettings, setProfileNotificationSettings] = useState<any[]>([]);

  useEffect(() => {
    async function loadAll() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Load tickets
        const { data: ticketsData } = await supabase
          .from('tickets')
          .select(`*, train:trains(*), station_from:stations!tickets_station_from_id_fkey(*), station_to:stations!tickets_station_to_id_fkey(*)`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setTickets(ticketsData ?? []);

        // Load bookings
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select(`*, ticket:tickets(*, train:trains(*), station_from:stations!tickets_station_from_id_fkey(*), station_to:stations!tickets_station_to_id_fkey(*))`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setBookings(bookingsData ?? []);

        // Load bonus
        const [accountData, transactionsData] = await Promise.all([
          getBonusAccount(),
          getBonusTransactions(),
        ]);
        setBonusAccount(accountData);
        setBonusTransactions(transactionsData);

        // Load history
        const historyData = await getTripHistory();
        setHistoryTickets(historyData);

        // Load notifications
        const notificationsData = await getNotifications(50);
        setNotifications(notificationsData);

        // Load profile data
        const [cardsData, subsData, settingsData] = await Promise.all([
          getLinkedCards(),
          getSubscriptions(),
          getNotificationSettings(),
        ]);
        setProfileCards(cardsData);
        setProfileSubscriptions(subsData);
        setProfileNotificationSettings(settingsData);
        setProfileFullName(user.user_metadata?.full_name || '');
        setProfilePhone(user.user_metadata?.phone || '');
        setProfileBirthDate(user.user_metadata?.birth_date || '');
      }

      setLoading(false);
    }
    loadAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const activeStatuses = ['paid', 'pending_payment', 'issued'];
  const pastStatuses = ['completed', 'cancelled', 'refund_approved', 'refund_rejected'];

  const filteredTickets = tickets.filter((ticket) => {
    if (ticketsFilter === 'active' && !activeStatuses.includes(ticket.status)) return false;
    if (ticketsFilter === 'past' && !pastStatuses.includes(ticket.status)) return false;
    if (ticketsSearch) {
      const q = ticketsSearch.toLowerCase();
      return ticket.id.toLowerCase().includes(q) ||
        new Date(ticket.departure_date).toLocaleDateString('ru-RU').includes(q) ||
        ticket.train?.number?.toLowerCase().includes(q);
    }
    return true;
  });

  const activeBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const unreadCount = notifications.filter(n => !n.read).length;

  const levelInfo = BONUS_LEVELS.find(l => l.level === bonusAccount?.level);
  const nextLevel = BONUS_LEVELS[BONUS_LEVELS.findIndex(l => l.level === bonusAccount?.level) + 1];

  const statusLabels: Record<string, string> = {
    pending: 'Ожидает подтверждения',
    confirmed: 'Подтверждено',
    cancelled: 'Отменено',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.user_metadata?.full_name || 'Пассажир'}
        </h1>
        <p className="text-gray-500 mt-1">
          Управление билетами, бронированиями и настройками
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-red-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard />

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* ===== TICKETS TAB ===== */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Мои билеты</h2>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Поиск по номеру, дате, поезду..."
                className="pl-10"
                value={ticketsSearch}
                onChange={(e) => setTicketsSearch(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              {(['all', 'active', 'past'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTicketsFilter(f)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    ticketsFilter === f
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'Все' : f === 'active' ? 'Активные' : 'Прошедшие'}
                </button>
              ))}
            </div>

            {filteredTickets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTickets.map((ticket: any) => (
                  <TicketCard key={ticket.id} ticket={ticket as TicketWithDetails} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  {ticketsSearch ? 'Билеты не найдены' : 'У вас пока нет билетов'}
                </p>
                <Link
                  href="/trains"
                  className="mt-4 inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Купить билет
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ===== BOOKINGS TAB ===== */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Мои бронирования</h2>

            {activeBookings.length > 0 ? (
              <div className="space-y-3">
                {activeBookings.map((booking: any) => (
                  <Link
                    key={booking.id}
                    href={`/tickets/${booking.ticket?.id}`}
                    className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-red-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <CalendarCheck className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {booking.ticket?.train?.name || 'Поезд'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {booking.ticket?.station_from_id} → {booking.ticket?.station_to_id}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[booking.status]}`}>
                        {statusLabels[booking.status]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {new Date(booking.ticket?.departure_date).toLocaleDateString('ru-RU')}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {booking.ticket?.price?.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Нет активных бронирований</p>
                <Link
                  href="/trains"
                  className="mt-4 inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  <Train className="w-4 h-4" />
                  Купить билет
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ===== BONUS TAB ===== */}
        {activeTab === 'bonus' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">РЖД Бонус</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Gift className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Премиальные баллы</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {bonusAccount?.premium_balance?.toLocaleString('ru-RU') || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Квалификационные баллы</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {bonusAccount?.qualification_balance?.toLocaleString('ru-RU') || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ваш уровень</p>
                    <p className="text-xl font-bold text-gray-900">
                      {levelInfo?.name || 'Базовый'}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  Коэффициент: ×{levelInfo?.multiplier || 1}
                </span>
              </div>
              {nextLevel && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Прогресс до {nextLevel.name}</span>
                    <span className="font-medium text-gray-900">
                      {bonusAccount?.total_miles?.toLocaleString('ru-RU') || 0} / {nextLevel.min_miles.toLocaleString('ru-RU')} миль
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-red-600 h-2.5 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((bonusAccount?.total_miles || 0) / nextLevel.min_miles) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">История операций</h3>
              </div>
              {bonusTransactions.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {bonusTransactions.map((tx: any) => (
                    <div key={tx.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.type === 'accrual' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {tx.type === 'accrual' ? (
                            <ArrowUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowDown className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(tx.created_at).toLocaleDateString('ru-RU', {
                              day: 'numeric', month: 'long', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold ${tx.type === 'accrual' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'accrual' ? '+' : '-'}{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">История операций пуста</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== HISTORY TAB ===== */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">История поездок</h2>
              <Button variant="outline" size="sm" onClick={() => setShowHistoryFilters(!showHistoryFilters)}>
                <Filter className="w-4 h-4 mr-2" />
                Фильтры
              </Button>
            </div>

            {showHistoryFilters && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Период</Label>
                    <select
                      value={historyPeriod}
                      onChange={(e) => setHistoryPeriod(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Все время</option>
                      <option value="month">Месяц</option>
                      <option value="quarter">Квартал</option>
                      <option value="year">Год</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Номер поезда</Label>
                    <Input
                      value={historyTrainNumber}
                      onChange={(e) => setHistoryTrainNumber(e.target.value)}
                      placeholder="001А"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Категория вагона</Label>
                    <select
                      value={historyWagonCategory}
                      onChange={(e) => setHistoryWagonCategory(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Все</option>
                      {Object.entries(WAGON_CATEGORIES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {historyTickets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {historyTickets.map((ticket: any) => (
                  <TicketCard key={ticket.id} ticket={ticket as TicketWithDetails} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">История поездок пуста</p>
              </div>
            )}
          </div>
        )}

        {/* ===== NOTIFICATIONS TAB ===== */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Уведомления</h2>
                <p className="text-sm text-gray-500">
                  {unreadCount > 0
                    ? `${unreadCount} непрочитанных`
                    : 'Нет непрочитанных уведомлений'}
                </p>
              </div>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={async () => {
                  await markAllNotificationsAsRead();
                  setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                }}>
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
                      className={`bg-white rounded-lg border p-4 transition-colors cursor-pointer ${
                        notification.read ? 'border-gray-200' : 'border-red-200 bg-red-50/50'
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          markNotificationAsRead(notification.id);
                          setNotifications(prev =>
                            prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                          );
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          notification.read ? 'bg-gray-100' : 'bg-red-100'
                        }`}>
                          <ChannelIcon className={`w-5 h-5 ${notification.read ? 'text-gray-400' : 'text-red-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-400">
                              {new Date(notification.created_at).toLocaleDateString('ru-RU', {
                                day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                            <span className="text-xs text-gray-300">·</span>
                            <span className="text-xs text-gray-400">
                              {topicLabels[notification.topic] || notification.topic}
                            </span>
                          </div>
                        </div>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Нет уведомлений</p>
              </div>
            )}
          </div>
        )}

        {/* ===== PROFILE TAB ===== */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {user?.user_metadata?.full_name || 'Пассажир'}
                </p>
                <p className="text-sm text-gray-500">{user?.email}</p>
                {user?.user_metadata?.bonus_account && (
                  <p className="text-xs text-red-600">
                    Счёт РЖД Бонус: {user.user_metadata.bonus_account}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Личные данные</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>ФИО</Label>
                  <Input value={profileFullName} onChange={(e) => setProfileFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input value={user?.email || ''} className="pl-10" disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Телефон</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+7 (999) 123-45-67"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Дата рождения</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="date"
                      value={profileBirthDate}
                      onChange={(e) => setProfileBirthDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Привязанные карты</h3>
              {profileCards.length > 0 ? (
                <div className="space-y-2">
                  {profileCards.map((card: any) => (
                    <div key={card.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{card.card_number}</p>
                          <p className="text-xs text-gray-500">{card.card_holder} · {card.expiry_date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Нет привязанных карт</p>
              )}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Подписки на рассылки</h3>
              {profileSubscriptions.length > 0 ? (
                <div className="space-y-3">
                  {profileSubscriptions.map((sub: any) => (
                    <label key={sub.id} className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">
                        {subscriptionLabels[sub.type] || sub.type}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        sub.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {sub.enabled ? 'Подписан' : 'Отписан'}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Нет доступных подписок</p>
              )}
            </div>

            <div className="flex justify-center">
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
              >
                <User className="w-4 h-4" />
                Полный профиль
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}