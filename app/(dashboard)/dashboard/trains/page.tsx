'use client';

import { useState } from 'react';
import { TrainSearch } from '@/components/trains/train-search';
import { TrainCard } from '@/components/trains/train-card';
import { Train } from '@/lib/types';
import { Train as TrainIcon, SearchX } from 'lucide-react';

export default function DashboardTrainsPage() {
  const [trains, setTrains] = useState<Train[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchDate, setSearchDate] = useState<string>('');

  function handleResults(results: Train[]) {
    setTrains(results);
    setHasSearched(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Поиск поездов</h1>
        <p className="text-gray-500 mt-1">
          Найдите подходящий поезд и купите билет
        </p>
      </div>

      <TrainSearch onResults={handleResults} onSearching={setIsSearching} onDateChange={setSearchDate} />

      {isSearching && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500">Поиск поездов...</p>
        </div>
      )}

      {!isSearching && hasSearched && trains.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <SearchX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Поезда не найдены</p>
          <p className="text-sm text-gray-400 mt-1">
            Попробуйте изменить параметры поиска
          </p>
        </div>
      )}

      {!isSearching && trains.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Найдено поездов: {trains.length}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {trains.map((train) => (
              <TrainCard key={train.id} train={train} date={searchDate || undefined} />
            ))}
          </div>
        </div>
      )}

      {!isSearching && !hasSearched && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <TrainIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            Введите города отправления и назначения для поиска
          </p>
        </div>
      )}
    </div>
  );
}