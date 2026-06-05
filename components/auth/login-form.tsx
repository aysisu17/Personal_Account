'use client';

import { useState } from 'react';
import { signInAction, signInWithBonusAccountAction, resetPasswordAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Mail, Lock, CreditCard, ArrowLeft } from 'lucide-react';

type LoginMode = 'email' | 'bonus';

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<LoginMode>('email');
  const [showReset, setShowReset] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const action = mode === 'email' ? signInAction : signInWithBonusAccountAction;
    const result = await action(undefined, formData);

    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  async function handleResetPassword(formData: FormData) {
    setPending(true);
    setError(null);
    setResetMessage(null);

    const result = await resetPasswordAction(undefined, formData);

    if (result?.error) {
      setError(result.error);
    } else if (result?.message) {
      setResetMessage(result.message);
    }

    setPending(false);
  }

  if (showReset) {
    return (
      <form action={handleResetPassword} className="space-y-4">
        <button
          type="button"
          onClick={() => { setShowReset(false); setError(null); setResetMessage(null); }}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к входу
        </button>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Восстановление пароля</h3>
          <p className="text-sm text-gray-500 mb-4">
            Введите ваш email, мы отправим ссылку для сброса пароля
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="resetEmail">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="resetEmail"
              name="email"
              type="email"
              placeholder="ivan@example.com"
              className="pl-10"
              required
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        {resetMessage && (
          <p className="text-sm text-green-600">{resetMessage}</p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Отправка...' : 'Отправить ссылку'}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => { setMode('email'); setError(null); }}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            mode === 'email' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          По email
        </button>
        <button
          type="button"
          onClick={() => { setMode('bonus'); setError(null); }}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            mode === 'bonus' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          По номеру счёта
        </button>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {mode === 'email' ? (
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ivan@example.com"
                className="pl-10"
                required
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="bonusAccount">Номер счёта «РЖД Бонус»</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="bonusAccount"
                name="bonusAccount"
                type="text"
                placeholder="RZDXXXXXXXX"
                className="pl-10"
                required
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Пароль</Label>
            <button
              type="button"
              onClick={() => { setShowReset(true); setError(null); }}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Забыли пароль?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              className="pl-10"
              required
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Вход...' : 'Войти'}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Нет аккаунта?{' '}
        <Link href="/register" className="text-red-600 hover:text-red-700 font-medium">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}