'use client';

import { useState } from 'react';
import { signUpAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { User, Mail, Lock, Phone, Calendar } from 'lucide-react';

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setSuccess(null);

    const result = await signUpAction(undefined, formData);

    if (result?.error) {
      setError(result.error);
    } else if (result?.success && result.message) {
      setSuccess(result.message);
    }

    setPending(false);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">ФИО</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Иванов Иван Иванович"
            className="pl-10"
            required
          />
        </div>
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="phone">Телефон (необязательно)</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+7 (999) 123-45-67"
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthDate">Дата рождения</Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            id="birthDate"
            name="birthDate"
            type="date"
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Минимум 6 символов"
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="flex items-start gap-2">
        <input
          id="consent"
          name="consent"
          type="checkbox"
          required
          className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
        />
        <Label htmlFor="consent" className="text-sm text-gray-600 cursor-pointer">
          Я даю согласие на обработку моих персональных данных в соответствии с{' '}
          <Link href="/privacy" className="text-red-600 hover:text-red-700 underline">
            политикой обработки персональных данных
          </Link>
        </Label>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-600">{success}</p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Регистрация...' : 'Зарегистрироваться'}
      </Button>

      <p className="text-center text-sm text-gray-600">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="text-red-600 hover:text-red-700 font-medium">
          Войти
        </Link>
      </p>
    </form>
  );
}