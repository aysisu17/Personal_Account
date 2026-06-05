'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Train,
  Ticket,
  CalendarCheck,
  User,
  Gift,
  History,
  Bell,
  Shield,
  LogOut,
} from 'lucide-react';
import { signOutAction } from '@/app/actions/auth';

interface SidebarProps {
  userEmail?: string;
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = userEmail === 'marchenkoa1986@gmail.com';

  const navItems = [
    {
      href: '/cabinet',
      label: 'Кабинет',
      icon: LayoutDashboard,
    },
    {
      href: '/trains',
      label: 'Поезда',
      icon: Train,
    },
    {
      href: '/tickets',
      label: 'Билеты',
      icon: Ticket,
    },
    {
      href: '/bookings',
      label: 'Бронирования',
      icon: CalendarCheck,
    },
    {
      href: '/bonus',
      label: 'РЖД Бонус',
      icon: Gift,
    },
    {
      href: '/history',
      label: 'История поездок',
      icon: History,
    },
    {
      href: '/notifications',
      label: 'Уведомления',
      icon: Bell,
    },
    {
      href: '/profile',
      label: 'Профиль',
      icon: User,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">РЖД</span>
          </div>
          <span className="font-bold text-gray-900">Личный кабинет</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-red-50 text-red-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}

        {/* Admin Panel - only visible for admin user */}
        {isAdmin && (
          <Link
            href="/admin/dashboard"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith('/admin')
                ? 'bg-red-50 text-red-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Shield className="w-5 h-5" />
            Админ-панель
          </Link>
        )}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Выйти
          </button>
        </form>
      </div>
    </aside>
  );
}