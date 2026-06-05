'use client';

import { useState, useEffect } from 'react';
import { Ticket, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { TicketCard } from '@/components/tickets/ticket-card';
import { Input } from '@/components/ui/input';
import { TicketWithDetails, TICKET_STATUS_LABELS, TICKET_STATUS_COLORS } from '@/lib/types';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'past'>('all');

  useEffect(() => {
    async function loadTickets() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from('tickets')
        .select(`
          *,
          train:trains(*),
          station_from:stations!tickets_station_from_id_fkey(*),
          station_to:stations!tickets_station_to_id_fkey(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data: ticketsData } = await query;
      setTickets(ticketsData ?? []);
      setLoading(false);
    }
    loadTickets();
  }, []);

  const activeStatuses = ['paid', 'pending_payment', 'issued'];
  const pastStatuses = ['completed', 'cancelled', 'refund_approved', 'refund_rejected'];

  const filteredTickets = tickets.filter((ticket) => {
    // Filter by status
    if (filter === 'active' && !activeStatuses.includes(ticket.status)) return false;
    if (filter === 'past' && !pastStatuses.includes(ticket.status)) return false;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesId = ticket.id.toLowerCase().includes(query);
      const matchesDate = new Date(ticket.departure_date).toLocaleDateString('ru-RU').includes(query);
      const matchesTrain = ticket.train?.number?.toLowerCase().includes(query);
      const matchesStation = ticket.station_from_id?.toLowerCase().includes(query) ||
                          ticket.station_to_id?.toLowerCase().includes(query);
      return matchesId || matchesDate || matchesTrain || matchesStation;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Мои билеты</h1>
        <p className="text-gray-500 mt-1">
          История ваших поездок и купленных билетов
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Поиск по номеру билета, дате, поезду или станции..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'active', 'past'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === f
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
            {searchQuery ? 'Билеты не найдены' : 'У вас пока нет билетов'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Купите билет на поезд, чтобы он появился здесь'}
          </p>
          {!searchQuery && (
            <Link
              href="/trains"
              className="mt-4 inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Купить билет
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}