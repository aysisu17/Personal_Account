'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { buyTicketAction } from '@/app/actions/tickets';
import { getBonusAccount } from '@/app/actions/bonus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WAGON_CATEGORIES, SEAT_TYPES } from '@/lib/types';

interface BuyTicketFormProps {
  trainId: string;
  departureDate?: string;
  arrivalDate?: string;
}

export function BuyTicketForm({ trainId, departureDate, arrivalDate }: BuyTicketFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [stationFrom, setStationFrom] = useState<string>('');
  const [stationTo, setStationTo] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [useBonus, setUseBonus] = useState(false);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [bonusToUse, setBonusToUse] = useState(0);
  const [maxBonus, setMaxBonus] = useState(0);

  useEffect(() => {
    setPrice(Math.floor(Math.random() * 3000) + 500);
  }, []);

  useEffect(() => {
    async function loadBonus() {
      if (price === 0) return;
      const account = await getBonusAccount();
      if (account) {
        setBonusBalance(account.premium_balance);
        setMaxBonus(Math.min(account.premium_balance, Math.floor(price * 0.5)));
      }
    }
    loadBonus();
  }, [price]);

  const finalPrice = useBonus ? price - bonusToUse : price;

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    formData.set('trainId', trainId);
    formData.set('price', finalPrice.toString());
    formData.set('useBonus', useBonus.toString());
    formData.set('bonusAmount', bonusToUse.toString());
    formData.set('departureDate', departureDate || '');
    formData.set('arrivalDate', arrivalDate || '');

    const result = await buyTicketAction(undefined, formData);

    if (result?.error) {
      setError(result.error);
      setPending(false);
    } else if (result?.success && result?.ticketId) {
      router.push(`/tickets/${result.ticketId}`);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="trainId" value={trainId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stationFromName">Станция отправления</Label>
          <Input
            id="stationFromName"
            name="stationFromName"
            type="text"
            placeholder="Москва (Ленинградский вокзал)"
            value={stationFrom}
            onChange={(e) => setStationFrom(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stationToName">Станция назначения</Label>
          <Input
            id="stationToName"
            name="stationToName"
            type="text"
            placeholder="Санкт-Петербург (Московский вокзал)"
            value={stationTo}
            onChange={(e) => setStationTo(e.target.value)}
            required
          />
        </div>
      </div>

      {departureDate && (
        <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
          Дата отправления: <strong>{departureDate}</strong>
          {arrivalDate && arrivalDate !== departureDate && (
            <> · Дата прибытия: <strong>{arrivalDate}</strong></>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="wagonCategory">Категория вагона</Label>
          <select
            id="wagonCategory"
            name="wagonCategory"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            {Object.entries(WAGON_CATEGORIES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wagonNumber">Номер вагона</Label>
          <Input
            id="wagonNumber"
            name="wagonNumber"
            type="text"
            placeholder="Например: 3"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="seatNumber">Номер места</Label>
          <Input
            id="seatNumber"
            name="seatNumber"
            type="text"
            placeholder="Например: 12A"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="seatType">Тип места</Label>
          <select
            id="seatType"
            name="seatType"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            {Object.entries(SEAT_TYPES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bonus usage */}
      {bonusBalance > 0 && (
        <div className="bg-yellow-50 rounded-lg p-4 space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useBonus}
              onChange={(e) => setUseBonus(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Использовать бонусные баллы (доступно: {bonusBalance})
            </span>
          </label>

          {useBonus && (
            <div>
              <Label htmlFor="bonusAmount">Списать баллов (макс. {maxBonus})</Label>
              <Input
                id="bonusAmount"
                name="bonusAmount"
                type="number"
                min={0}
                max={maxBonus}
                value={bonusToUse}
                onChange={(e) => setBonusToUse(Math.min(parseInt(e.target.value) || 0, maxBonus))}
              />
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Стоимость билета</span>
          <span className="text-xl font-bold text-gray-900">
            {finalPrice.toLocaleString('ru-RU')} ₽
          </span>
        </div>
        {useBonus && bonusToUse > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-600">Списано баллов</span>
            <span className="text-green-600">-{bonusToUse}</span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Оформление...' : 'Купить билет'}
      </Button>
    </form>
  );
}