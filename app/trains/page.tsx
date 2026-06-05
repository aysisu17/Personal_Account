'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { TrainSearch } from '@/components/trains/train-search';
import { TrainCard } from '@/components/trains/train-card';
import { Train } from '@/lib/types';
import { Train as TrainIcon, SearchX, ArrowLeft, LogIn, User, LogOut } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PublicTrainsPage() {
  const [trains, setTrains] = useState<Train[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFrom = searchParams.get('from') || '';
  const initialTo = searchParams.get('to') || '';
  const hasInitialParams = !!(initialFrom && initialTo);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  }

  function handleResults(results: Train[]) {
    setTrains(results);
    setHasSearched(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>
          <div className="flex items-center gap-4">
            {loading ? null : user ? (
              <>
                <Link
                  href="/cabinet"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-red-600" />
                  </div>
                  {user.user_metadata?.full_name || 'Пассажир'}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  Войти
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Поиск поездов</h1>
            <p className="text-gray-500 mt-1">
              Найдите подходящий поезд и купите билет
            </p>
          </div>

          <TrainSearch
            onResults={handleResults}
            onSearching={setIsSearching}
            initialFrom={initialFrom}
            initialTo={initialTo}
            autoSearch={hasInitialParams}
          />

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
                  <TrainCard key={train.id} train={train} basePath="/trains" />
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

          {/* Popular routes */}
          {!hasSearched && !isSearching && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Популярные направления
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {popularRoutes.map((route, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      // Pre-fill search by navigating with query params
                      const form = document.querySelector('form');
                      if (form) {
                        const fromInput = form.querySelector('[name="fromCity"]') as HTMLInputElement;
                        const toInput = form.querySelector('[name="toCity"]') as HTMLInputElement;
                        if (fromInput && toInput) {
                          fromInput.value = route.from;
                          toInput.value = route.to;
                          form.requestSubmit();
                        }
                      }
                    }}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:border-red-200 hover:shadow-sm transition-all text-left"
                  >
                    <p className="font-medium text-gray-900">
                      {route.from} → {route.to}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{route.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CTA for registration */}
          {!hasSearched && !isSearching && !user && (
            <div className="bg-red-600 rounded-xl p-6 text-center mt-8">
              <h2 className="text-xl font-bold text-white mb-2">
                Зарегистрируйтесь для покупки билетов
              </h2>
              <p className="text-red-100 mb-4">
                Получите доступ к бронированию, бонусам и истории поездок
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors"
              >
                <LogIn className="w-5 h-5" />
                Создать аккаунт
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const popularRoutes = [
  { from: 'Москва', to: 'Санкт-Петербург', description: '≈ 4 часа на Сапсане' },
  { from: 'Москва', to: 'Казань', description: '≈ 12 часов' },
  { from: 'Санкт-Петербург', to: 'Москва', description: '≈ 4 часа на Сапсане' },
  { from: 'Москва', to: 'Нижний Новгород', description: '≈ 4 часа' },
  { from: 'Москва', to: 'Сочи', description: '≈ 24 часа' },
  { from: 'Екатеринбург', to: 'Москва', description: '≈ 24 часа' },
];