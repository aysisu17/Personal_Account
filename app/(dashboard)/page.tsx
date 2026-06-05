import { createClient } from '@/lib/supabase/server';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { Train, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user's tickets
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', user?.id);

  const activeTickets = tickets?.filter((t) => t.status === 'active').length ?? 0;
  const totalTrips = tickets?.length ?? 0;

  // Fetch user's bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', user?.id)
    .in('status', ['pending', 'confirmed']);

  const upcomingBookings = bookings?.length ?? 0;

  // Fetch recent tickets with details
  const { data: recentTickets } = await supabase
    .from('tickets')
    .select(`
      *,
      train:trains(*),
      station_from:stations!tickets_station_from_id_fkey(*),
      station_to:stations!tickets_station_to_id_fkey(*)
    `)
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Здравствуйте, {user?.user_metadata?.full_name || 'Пассажир'}!
        </h1>
        <p className="text-gray-500 mt-1">
          Добро пожаловать в личный кабинет пассажира РЖД
        </p>
      </div>

      <StatsCards
        activeTickets={activeTickets}
        totalTrips={totalTrips}
        upcomingBookings={upcomingBookings}
      />

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Последние билеты</h2>
          <Link
            href="/tickets"
            className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
          >
            Все билеты
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentTickets && recentTickets.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {recentTickets.map((ticket: any) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Train className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {ticket.train?.name || ticket.train?.number || 'Поезд'} · {ticket.train?.route || '—'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ticket.station_from_id || '—'} → {ticket.station_to_id || '—'} · {new Date(ticket.departure_date).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {ticket.price?.toLocaleString('ru-RU')} ₽
                  </p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    ticket.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : ticket.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {ticket.status === 'active' ? 'Активен' : ticket.status === 'cancelled' ? 'Отменён' : 'Использован'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Train className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">У вас пока нет билетов</p>
            <Link
              href="/trains"
              className="mt-3 inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Купить билет
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}