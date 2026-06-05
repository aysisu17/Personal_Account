import Link from 'next/link';
import { Train, MapPin, Calendar, CreditCard } from 'lucide-react';
import { TicketWithDetails, TICKET_STATUS_LABELS, TICKET_STATUS_COLORS, WAGON_CATEGORIES, SEAT_TYPES } from '@/lib/types';

interface TicketCardProps {
  ticket: TicketWithDetails;
}

export function TicketCard({ ticket }: TicketCardProps) {
  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-red-200 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Train className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {ticket.train?.name || `Поезд №${ticket.train?.number}`}
            </p>
            <p className="text-xs text-gray-500">{ticket.train?.route}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TICKET_STATUS_COLORS[ticket.status] || 'bg-gray-100 text-gray-600'}`}>
          {TICKET_STATUS_LABELS[ticket.status] || ticket.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1.5 text-gray-500">
          <MapPin className="w-3.5 h-3.5" />
          <span>{ticket.station_from_id} → {ticket.station_to_id}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(ticket.departure_date).toLocaleDateString('ru-RU')}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500">
          <span className="font-medium">Место:</span>
          <span>{ticket.seat_number} ({SEAT_TYPES[ticket.seat_type] || ticket.seat_type})</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500">
          <span className="font-medium">Вагон:</span>
          <span>{ticket.wagon_number} ({WAGON_CATEGORIES[ticket.wagon_category] || ticket.wagon_category})</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-900 font-semibold col-span-2">
          <CreditCard className="w-3.5 h-3.5" />
          <span>{ticket.price.toLocaleString('ru-RU')} ₽</span>
          {ticket.bonus_used > 0 && (
            <span className="text-xs text-green-600 font-normal">
              (списано {ticket.bonus_used} баллов)
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}