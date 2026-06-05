import Link from 'next/link';
import { Train } from 'lucide-react';
import { Train as TrainType } from '@/lib/types';

interface TrainCardProps {
  train: TrainType;
  basePath?: string;
  date?: string;
}

export function TrainCard({ train, basePath = '/dashboard/trains', date }: TrainCardProps) {
  const typeLabels: Record<string, string> = {
    sapsan: 'Сапсан',
    lastochka: 'Ласточка',
    skory: 'Скорый',
    passazhirsky: 'Пассажирский',
    firmenny: 'Фирменный',
  };

  const href = date ? `${basePath}/${train.id}?date=${encodeURIComponent(date)}` : `${basePath}/${train.id}`;

  return (
    <Link
      href={href}
      className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-red-200 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <Train className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">
                {train.name}
              </h3>
              {train.type && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                  {typeLabels[train.type] || train.type}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              №{train.number}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <div>
          <p className="text-gray-500">Маршрут</p>
          <p className="font-medium text-gray-900">{train.route}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500">Время</p>
          <p className="font-medium text-gray-900">
            {train.departure_time} — {train.arrival_time}
          </p>
        </div>
      </div>
    </Link>
  );
}