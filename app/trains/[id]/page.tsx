'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { TrainDetails } from '@/components/trains/train-details';
import { ArrowLeft, LogIn, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PublicTrainDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [train, setTrain] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setUserLoading(false);
    });

    supabase
      .from('trains')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) {
          notFound();
        }
        setTrain(data);
        setLoading(false);
      });
  }, [id]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!train) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/trains"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к поиску
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <TrainDetails train={train} />

          {/* CTA - Login to buy ticket */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Купить билет
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Для покупки билетов необходимо войти в личный кабинет или
              зарегистрироваться. После входа вы сможете выбрать места,
              оплатить и получить электронный билет.
            </p>
            <div className="flex items-center justify-center gap-4">
              {user ? (
                <Link
                  href={`/dashboard/trains/${id}`}
                  className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-md"
                >
                  Купить билет
                </Link>
              ) : (
                <>
                  <Link
                    href={`/login?redirect=/trains/${id}`}
                    className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-md"
                  >
                    Войти и купить
                  </Link>
                  <Link
                    href={`/register?redirect=/trains/${id}`}
                    className="inline-flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Зарегистрироваться
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h4 className="font-medium text-gray-900 text-sm">Электронный билет</h4>
              <p className="text-xs text-gray-500 mt-1">Без бумажного носителя</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h4 className="font-medium text-gray-900 text-sm">Бонусы РЖД</h4>
              <p className="text-xs text-gray-500 mt-1">Копите и тратьте баллы</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <h4 className="font-medium text-gray-900 text-sm">История поездок</h4>
              <p className="text-xs text-gray-500 mt-1">Все билеты в одном месте</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}