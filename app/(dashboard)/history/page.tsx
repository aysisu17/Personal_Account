'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getTripHistory } from '@/app/actions/tickets';
import { TicketCard } from '@/components/tickets/ticket-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { History, Download, Search, Filter } from 'lucide-react';
import { TicketWithDetails, WAGON_CATEGORIES } from '@/lib/types';

export default function HistoryPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [period, setPeriod] = useState<string>('');
  const [trainNumber, setTrainNumber] = useState('');
  const [wagonCategory, setWagonCategory] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets(filters?: any) {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const data = await getTripHistory(
      filters?.period || period,
      undefined,
      undefined,
      filters?.trainNumber || trainNumber,
      filters?.wagonCategory || wagonCategory
    );

    setTickets(data);
    setLoading(false);
  }

  function handleApplyFilters() {
    loadTickets({ period, trainNumber, wagonCategory });
  }

  function handleResetFilters() {
    setPeriod('');
    setTrainNumber('');
    setWagonCategory('');
    loadTickets({ period: '', trainNumber: '', wagonCategory: '' });
  }

  function handleExport() {
    // Create CSV content
    const headers = ['Номер билета', 'Поезд', 'Маршрут', 'Дата', 'Вагон', 'Место', 'Стоимость', 'Статус'];
    const rows = tickets.map((t: any) => [
      t.id,
      t.train?.name || t.train?.number,
      `${t.station_from_id} → ${t.station_to_id}`,
      new Date(t.departure_date).toLocaleDateString('ru-RU'),
      `${WAGON_CATEGORIES[t.wagon_category] || t.wagon_category} №${t.wagon_number}`,
      t.seat_number,
      `${t.price} ₽`,
      t.status,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
          <h1 className="text-2xl font-bold text-gray-900">История поездок</h1>
          <p className="text-gray-500 mt-1">
            Хронологический список завершённых поездок
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            Фильтры
          </Button>
          {tickets.length > 0 && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Экспорт CSV
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Период</Label>
              <select
                id="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Все время</option>
                <option value="month">Месяц</option>
                <option value="quarter">Квартал</option>
                <option value="year">Год</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trainNumber">Номер поезда</Label>
              <Input
                id="trainNumber"
                value={trainNumber}
                onChange={(e) => setTrainNumber(e.target.value)}
                placeholder="001А"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wagonCategory">Категория вагона</Label>
              <select
                id="wagonCategory"
                value={wagonCategory}
                onChange={(e) => setWagonCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Все</option>
                {Object.entries(WAGON_CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleApplyFilters}>Применить</Button>
              <Button variant="outline" onClick={handleResetFilters}>Сбросить</Button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {tickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tickets.map((ticket: any) => (
            <TicketCard key={ticket.id} ticket={ticket as TicketWithDetails} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">История поездок пуста</p>
          <p className="text-sm text-gray-400 mt-1">
            Завершённые поездки будут отображаться здесь
          </p>
        </div>
      )}
    </div>
  );
}