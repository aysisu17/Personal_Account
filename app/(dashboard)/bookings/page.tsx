import { CalendarCheck, Ticket as TicketIcon } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BookingWithTicket } from '@/lib/types';

export default async function BookingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      ticket:tickets(
        *,
        train:trains(*),
        station_from:stations!tickets_station_from_id_fkey(*),
        station_to:stations!tickets_station_to_id_fkey(*)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const activeBookings = bookings?.filter(
    (b) => b.status === 'pending' || b.status === 'confirmed'
  ) ?? [];

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Мои бронирования</h1>
        <p className="text-gray-500 mt-1">
          Активные бронирования билетов
        </p>
      </div>

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
          <p className="text-sm text-gray-400 mt-1">
            Забронируйте билет на поезд
          </p>
          <Link
            href="/trains"
            className="mt-4 inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            <TicketIcon className="w-4 h-4" />
            Купить билет
          </Link>
        </div>
      )}
    </div>
  );
}