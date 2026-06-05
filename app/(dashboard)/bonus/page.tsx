'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getBonusAccount, getBonusTransactions, creditTripAction, calculateBonusForTrip, getBonusLevelInfo } from '@/app/actions/bonus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, TrendingUp, Award, Plus, Calculator, History, ArrowUp, ArrowDown } from 'lucide-react';
import { BONUS_LEVELS } from '@/lib/types';

export default function BonusPage() {
  const [account, setAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [creditSuccess, setCreditSuccess] = useState<string | null>(null);
  const [creditPending, setCreditPending] = useState(false);
  const [calculatorPrice, setCalculatorPrice] = useState(5000);
  const [calculatorResult, setCalculatorResult] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const [accountData, transactionsData] = await Promise.all([
        getBonusAccount(),
        getBonusTransactions(),
      ]);

      setAccount(accountData);
      setTransactions(transactionsData);
      setLoading(false);
    }
    loadData();
  }, []);

  async function handleCreditTrip(formData: FormData) {
    setCreditPending(true);
    setCreditError(null);
    setCreditSuccess(null);

    const result = await creditTripAction(undefined, formData);

    if (result?.error) {
      setCreditError(result.error);
    } else if (result?.message) {
      setCreditSuccess(result.message);
      // Refresh data
      const [accountData, transactionsData] = await Promise.all([
        getBonusAccount(),
        getBonusTransactions(),
      ]);
      setAccount(accountData);
      setTransactions(transactionsData);
    }

    setCreditPending(false);
  }

  async function handleCalculator() {
    const result = await calculateBonusForTrip(calculatorPrice, account?.level || 'base');
    setCalculatorResult(result);
  }

  const levelInfo = BONUS_LEVELS.find(l => l.level === account?.level);
  const nextLevel = BONUS_LEVELS[BONUS_LEVELS.findIndex(l => l.level === account?.level) + 1];

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
        <h1 className="text-2xl font-bold text-gray-900">РЖД Бонус</h1>
        <p className="text-gray-500 mt-1">
          Управление бонусным счётом и программой лояльности
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Gift className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Премиальные баллы</p>
              <p className="text-2xl font-bold text-gray-900">
                {account?.premium_balance?.toLocaleString('ru-RU') || 0}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Можно использовать для оплаты билетов
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Квалификационные баллы</p>
              <p className="text-2xl font-bold text-gray-900">
                {account?.qualification_balance?.toLocaleString('ru-RU') || 0}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Влияют на уровень в программе лояльности
          </p>
        </div>
      </div>

      {/* Level Card */}
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

        {/* Progress bar */}
        {nextLevel && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Прогресс до {nextLevel.name}</span>
              <span className="font-medium text-gray-900">
                {account?.total_miles?.toLocaleString('ru-RU') || 0} / {nextLevel.min_miles.toLocaleString('ru-RU')} миль
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-red-600 h-2.5 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((account?.total_miles || 0) / nextLevel.min_miles) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Level benefits */}
        {levelInfo && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Преимущества уровня:</p>
            <ul className="space-y-1">
              {levelInfo.benefits.map((benefit: string, i: number) => (
                <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={() => setShowCreditForm(!showCreditForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Зачесть поездку
        </Button>
        <Button variant="outline" onClick={() => setShowCalculator(!showCalculator)}>
          <Calculator className="w-4 h-4 mr-2" />
          Калькулятор баллов
        </Button>
      </div>

      {/* Credit Trip Form */}
      {showCreditForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Зачесть прошлую поездку</h3>
          <form action={handleCreditTrip} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trainNumber">Номер поезда</Label>
                <Input id="trainNumber" name="trainNumber" placeholder="001А" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="route">Маршрут</Label>
                <Input id="route" name="route" placeholder="Москва → Санкт-Петербург" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departureDate">Дата отправления</Label>
                <Input id="departureDate" name="departureDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticketPrice">Стоимость билета (₽)</Label>
                <Input id="ticketPrice" name="ticketPrice" type="number" min="1" required />
              </div>
            </div>

            {creditError && <p className="text-sm text-red-500">{creditError}</p>}
            {creditSuccess && <p className="text-sm text-green-600">{creditSuccess}</p>}

            <Button type="submit" disabled={creditPending}>
              {creditPending ? 'Отправка...' : 'Зачесть поездку'}
            </Button>
          </form>
        </div>
      )}

      {/* Calculator */}
      {showCalculator && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Калькулятор начисления баллов</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="calculatorPrice">Стоимость планируемой поездки (₽)</Label>
              <Input
                id="calculatorPrice"
                type="number"
                min="1"
                value={calculatorPrice}
                onChange={(e) => setCalculatorPrice(parseInt(e.target.value) || 0)}
              />
            </div>
            <Button type="button" onClick={handleCalculator}>
              Рассчитать
            </Button>
            {calculatorResult !== null && (
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  За поездку стоимостью {calculatorPrice.toLocaleString('ru-RU')} ₽
                  будет начислено <strong>{calculatorResult} баллов</strong>
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Коэффициент вашего уровня: ×{levelInfo?.multiplier || 1}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">История операций</h3>
        </div>

        {transactions.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {transactions.map((tx: any) => (
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
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${
                  tx.type === 'accrual' ? 'text-green-600' : 'text-red-600'
                }`}>
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
  );
}