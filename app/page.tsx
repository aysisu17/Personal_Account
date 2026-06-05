'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Train, ArrowRight, Search, Clock, Ticket, Award, History, Bell, Shield, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      {/* Top bar with logo */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-md">
          <Train className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-lg">РЖД</span>
      </div>

      {/* Hero Section */}
      <div className="flex min-h-screen flex-col items-center justify-center p-4 relative">
        <div className="absolute top-4 right-4 flex items-center gap-4">
          {loading ? null : user ? (
            <>
              <Link
                href="/profile"
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

        <div className="w-full max-w-5xl space-y-12">
          {/* RZD Passenger Cabinet */}
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Train className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-gray-900">
              Личный кабинет пассажира
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Покупайте билеты на поезда, отслеживайте бронирования и управляйте
              поездками в одном месте
            </p>

            {/* Quick Navigation Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <Link
                href="/trains"
                className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-md"
              >
                <Search className="w-5 h-5" />
                Поиск поездов
              </Link>
              <Link
                href="/schedule"
                className="inline-flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Clock className="w-5 h-5" />
                Расписание
              </Link>
              <Link
                href={user ? '/cabinet' : '/register'}
                className="inline-flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Ticket className="w-5 h-5" />
                Купить билет
              </Link>
            </div>

            <div className="flex items-center justify-center gap-4 mt-4">
              {user ? (
                <Link
                  href="/cabinet"
                  className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-md"
                >
                  Личный кабинет
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-md"
                  >
                    Начать пользоваться
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Войти в аккаунт
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Popular Routes - Quick Access */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Популярные направления
              </h2>
              <Link
                href="/trains"
                className="text-sm text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1"
              >
                Все направления
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {popularRoutes.map((route, index) => (
                <Link
                  key={index}
                  href={`/trains?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-all"
                >
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Train className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {route.from} → {route.to}
                    </p>
                    <p className="text-xs text-gray-500">{route.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Поиск поездов</h3>
              <p className="text-sm text-gray-500 mt-1">
                Удобный поиск по направлениям и датам
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Ticket className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Покупка билетов</h3>
              <p className="text-sm text-gray-500 mt-1">
                Мгновенное оформление и оплата
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <History className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">История поездок</h3>
              <p className="text-sm text-gray-500 mt-1">
                Все билеты и бронирования в одном месте
              </p>
            </div>
          </div>

          {/* Additional Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">РЖД Бонус</h4>
                <p className="text-sm text-gray-500">Программа лояльности с начислением баллов</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Уведомления</h4>
                <p className="text-sm text-gray-500">Push, email и SMS оповещения</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Возврат билетов</h4>
                <p className="text-sm text-gray-500">Удобное оформление возврата</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Расписание</h4>
                <p className="text-sm text-gray-500">Актуальное расписание поездов</p>
              </div>
            </div>
          </div>

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
