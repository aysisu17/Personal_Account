'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getYearAnalytics, type YearAnalytics } from '@/app/actions/analytics';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Gift,
  PiggyBank,
  RotateCcw,
  BarChart3,
  Calendar,
  Train,
  Award,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const MONTH_NAMES_SHORT = [
  'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
  'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек',
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnalyticsDashboardProps {
  className?: string;
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  color,
  trend,
}: {
  icon: any;
  label: string;
  value: string;
  sublabel?: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-400',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p className={`text-lg font-bold ${trend ? trendColors[trend] : 'text-gray-900'}`}>
          {value}
        </p>
        {sublabel && (
          <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

// ─── Bar chart (simple CSS-based) ────────────────────────────────────────────

function MonthlyBarChart({
  data,
  label,
  color,
  maxValue,
}: {
  data: number[];
  label: string;
  color: string;
  maxValue?: number;
}) {
  const max = maxValue ?? Math.max(...data, 1);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <div className="flex items-end gap-1 h-24">
        {data.map((value, i) => {
          const height = max > 0 ? (value / max) * 100 : 0;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 group relative"
            >
              <div
                className={`w-full rounded-t ${color} transition-all duration-300 hover:opacity-80`}
                style={{ height: `${Math.max(height, value > 0 ? 4 : 0)}%` }}
              />
              <span className="text-[10px] text-gray-400">{MONTH_NAMES_SHORT[i]}</span>
              {/* Tooltip */}
              {value > 0 && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {MONTH_NAMES_SHORT[i]}: {value.toLocaleString('ru-RU')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<YearAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  // ── Load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const data = await getYearAnalytics(year);
      if (!cancelled) {
        setAnalytics(data);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [year]);

  // ── Derived values ─────────────────────────────────────────────────────────

  const maxTrips = useMemo(
    () => Math.max(...(analytics?.tripsByMonth ?? []), 1),
    [analytics?.tripsByMonth],
  );

  const maxSpending = useMemo(
    () => Math.max(...(analytics?.spendingByMonth ?? []), 1),
    [analytics?.spendingByMonth],
  );

  const netCost = useMemo(() => {
    if (!analytics) return 0;
    return analytics.totalSpent - analytics.totalRefunded - analytics.totalSavings;
  }, [analytics]);

  // ── Year navigation ────────────────────────────────────────────────────────

  const canGoBack = year > 2020;
  const canGoForward = year < new Date().getFullYear();

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className ?? ''}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────

  if (!analytics || analytics.totalTrips === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className ?? ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Аналитика поездок</h2>
          </div>
          <YearSelector
            year={year}
            onPrev={() => setYear((y) => y - 1)}
            onNext={() => setYear((y) => y + 1)}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
          />
        </div>
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Нет данных за {year} год</p>
          <p className="text-sm text-gray-400 mt-1">
            Совершите первую поездку, чтобы увидеть статистику
          </p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className ?? ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-semibold text-gray-900">Аналитика поездок</h2>
        </div>
        <YearSelector
          year={year}
          onPrev={() => setYear((y) => y - 1)}
          onNext={() => setYear((y) => y + 1)}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
        />
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Train}
          label="Поездок за год"
          value={analytics.totalTrips.toLocaleString('ru-RU')}
          sublabel={analytics.mostActiveMonth
            ? `Активный месяц: ${MONTH_NAMES_SHORT[analytics.mostActiveMonth - 1]}`
            : undefined}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={DollarSign}
          label="Потрачено всего"
          value={`${analytics.totalSpent.toLocaleString('ru-RU')} ₽`}
          sublabel={`Средний чек: ${analytics.averageTicketPrice.toLocaleString('ru-RU')} ₽`}
          color="bg-red-100 text-red-600"
          trend="down"
        />
        <StatCard
          icon={Gift}
          label="Накоплено баллов"
          value={analytics.totalBonusEarned.toLocaleString('ru-RU')}
          sublabel={`Потрачено: ${analytics.totalBonusUsed.toLocaleString('ru-RU')}`}
          color="bg-yellow-100 text-yellow-600"
          trend="up"
        />
        <StatCard
          icon={PiggyBank}
          label="Экономия"
          value={`${analytics.totalSavings.toLocaleString('ru-RU')} ₽`}
          sublabel={`Бонусы: ${analytics.totalBonusSavings.toLocaleString('ru-RU')} ₽ · Скидки: ${analytics.totalDiscountSavings.toLocaleString('ru-RU')} ₽`}
          color="bg-green-100 text-green-600"
          trend="up"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <MonthlyBarChart
          data={analytics.tripsByMonth}
          label="Поездки по месяцам"
          color="bg-blue-500"
          maxValue={maxTrips}
        />
        <MonthlyBarChart
          data={analytics.spendingByMonth}
          label="Траты по месяцам (₽)"
          color="bg-red-500"
          maxValue={maxSpending}
        />
      </div>

      {/* Bottom summary */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg p-4 border border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Всего потрачено</p>
            <p className="font-semibold text-gray-900">
              {analytics.totalSpent.toLocaleString('ru-RU')} ₽
            </p>
          </div>
          <div>
            <p className="text-gray-500">Экономия (бонусы)</p>
            <p className="font-semibold text-green-600">
              –{analytics.totalBonusSavings.toLocaleString('ru-RU')} ₽
            </p>
          </div>
          <div>
            <p className="text-gray-500">Экономия (скидки)</p>
            <p className="font-semibold text-green-600">
              –{analytics.totalDiscountSavings.toLocaleString('ru-RU')} ₽
            </p>
          </div>
          <div>
            <p className="text-gray-500">Возвращено</p>
            <p className="font-semibold text-orange-600">
              –{analytics.totalRefunded.toLocaleString('ru-RU')} ₽
            </p>
          </div>
          <div>
            <p className="text-gray-500">Чистый расход</p>
            <p className="font-semibold text-gray-900">
              {netCost.toLocaleString('ru-RU')} ₽
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Year selector sub-component ─────────────────────────────────────────────

function YearSelector({
  year,
  onPrev,
  onNext,
  canGoBack,
  canGoForward,
}: {
  year: number;
  onPrev: () => void;
  onNext: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onPrev}
        disabled={!canGoBack}
        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Предыдущий год"
      >
        <ChevronLeft className="w-4 h-4 text-gray-500" />
      </button>
      <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center select-none">
        {year}
      </span>
      <button
        onClick={onNext}
        disabled={!canGoForward}
        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Следующий год"
      >
        <ChevronRight className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
}