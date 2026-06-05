'use client';

import { useActionState } from 'react';
import { adminLoginAction } from '@/app/actions/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Mail } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [state, action, isPending] = useActionState(adminLoginAction, undefined);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Админ-панель
          </h1>
          <p className="mt-2 text-gray-400">
            Вход для администратора
          </p>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Пароль</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  required
                />
              </div>
            </div>

            {state?.error && (
              <p className="text-sm text-red-400">{state.error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              disabled={isPending}
            >
              {isPending ? 'Вход...' : 'Войти в админ-панель'}
            </Button>
          </form>
        </div>

        <p className="text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
            ← На главную
          </Link>
        </p>
      </div>
    </div>
  );
}
