'use client';

import { User } from 'lucide-react';

interface HeaderProps {
  userName: string | null;
  userEmail: string;
}

export function Header({ userName, userEmail }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-end gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">
            {userName || 'Пассажир'}
          </p>
          <p className="text-xs text-gray-500">{userEmail}</p>
        </div>
        <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-red-600" />
        </div>
      </div>
    </header>
  );
}