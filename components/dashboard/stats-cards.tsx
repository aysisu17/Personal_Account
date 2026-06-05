import { Ticket, CalendarCheck, Train, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  activeTickets: number;
  totalTrips: number;
  upcomingBookings: number;
}

export function StatsCards({ activeTickets, totalTrips, upcomingBookings }: StatsCardsProps) {
  const stats = [
    {
      label: 'Активные билеты',
      value: activeTickets,
      icon: Ticket,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      label: 'Всего поездок',
      value: totalTrips,
      icon: TrendingUp,
      color: 'text-green-600 bg-green-100',
    },
    {
      label: 'Предстоящие бронирования',
      value: upcomingBookings,
      icon: CalendarCheck,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      label: 'Доступные поезда',
      value: '—',
      icon: Train,
      color: 'text-orange-600 bg-orange-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}