'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Train, ArrowLeft, Clock, MapPin, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SchedulePage() {
  const [trains, setTrains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setUserLoading(false);
    });

    supabase
      .from('trains')
      .select('*')
      .order('departure_time', { ascending: true })
      .then(({ data }) => {
        setTrains(data ?? []);
        setLoading(false);
      });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
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
            {userLoading ? null : user ? (
              <>
                <Link
                  href="/dashboard"
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
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Расписание поездов</h1>
              <p className="text-gray-500 mt-1">
                Актуальное расписание движения поездов
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-gray-500">Загрузка расписания...</p>
            </div>
          ) : trains.length > 0 ? (
            <div className="space-y-3">
              {trains.map((train: any) => (
                <Link
                  key={train.id}
                  href={`/trains/${train.id}`}
                  className="block bg-white rounded-lg border border-gray-200 p-5 hover:border-red-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Train className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {train.name || `Поезд №${train.number}`}
                          </h3>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            №{train.number}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{train.route}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-gray-900">
                              Отправление: {train.departure_time || '—'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-orange-600" />
                            <span className="font-medium text-gray-900">
                              Прибытие: {train.arrival_time || '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-red-600 font-medium hover:text-red-700">
                        Подробнее →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Train className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Расписание пока недоступно</p>
              <p className="text-sm text-gray-400 mt-1">
                Поезда ещё не добавлены в систему
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}