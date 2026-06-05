'use client';

import { useState, useEffect, useRef } from 'react';
import { searchTrains } from '@/app/actions/trains';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Train } from '@/lib/types';

interface TrainSearchProps {
  onResults: (trains: Train[]) => void;
  onSearching: (isSearching: boolean) => void;
  onDateChange?: (date: string) => void;
  initialFrom?: string;
  initialTo?: string;
  autoSearch?: boolean;
}

const TRAIN_TYPES = [
  { value: 'all', label: 'Все типы' },
  { value: 'sapsan', label: 'Сапсан' },
  { value: 'lastochka', label: 'Ласточка' },
  { value: 'skory', label: 'Скорый' },
  { value: 'passazhirsky', label: 'Пассажирский' },
  { value: 'firmenny', label: 'Фирменный' },
];

export function TrainSearch({ onResults, onSearching, onDateChange, initialFrom, initialTo, autoSearch }: TrainSearchProps) {
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const autoSearched = useRef(false);

  // Auto-search when initial values are provided
  useEffect(() => {
    if (autoSearch && initialFrom && initialTo && !autoSearched.current && formRef.current) {
      autoSearched.current = true;
      // Small delay to ensure form is rendered
      const timer = setTimeout(() => {
        const formData = new FormData(formRef.current!);
        formData.set('fromCity', initialFrom);
        formData.set('toCity', initialTo);
        handleSubmit(formData);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialFrom, initialTo, autoSearch]);

  async function handleSubmit(formData: FormData) {
    setError(null);
    onSearching(true);

    const result = await searchTrains(formData);

    if (result.success) {
      onResults(result.data);
    } else if (result.error) {
      setError(result.error);
    }

    onSearching(false);
  }

  return (
    <form ref={formRef} action={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fromCity">Откуда</Label>
          <Input
            id="fromCity"
            name="fromCity"
            placeholder="Город отправления"
            defaultValue={initialFrom || ''}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="toCity">Куда</Label>
          <Input
            id="toCity"
            name="toCity"
            placeholder="Город назначения"
            defaultValue={initialTo || ''}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Дата</Label>
          <Input
            id="date"
            name="date"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => onDateChange?.(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="trainType">Тип поезда</Label>
          <select
            id="trainType"
            name="trainType"
            defaultValue="all"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            {TRAIN_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <Button type="submit" className="w-full md:w-auto">
        Найти поезда
      </Button>
    </form>
  );
}