import { Train } from 'lucide-react';
import { Train as TrainType } from '@/lib/types';

interface TrainDetailsProps {
  train: TrainType;
}

export function TrainDetails({ train }: TrainDetailsProps) {
  const typeLabels: Record<string, string> = {
    sapsan: 'Сапсан',
    lastochka: 'Ласточка',
    skory: 'Скорый',
    passazhirsky: 'Пассажирский',
    firmenny: 'Фирменный',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center">
          <Train className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">{train.name}</h2>
            {train.type && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                {typeLabels[train.type] || train.type}
              </span>
            )}
          </div>
          <p className="text-gray-500">Поезд №{train.number}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Маршрут</p>
          <p className="font-medium text-gray-900">{train.route}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Время отправления</p>
          <p className="font-medium text-gray-900">{train.departure_time}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Время прибытия</p>
          <p className="font-medium text-gray-900">{train.arrival_time}</p>
        </div>
      </div>
    </div>
  );
}