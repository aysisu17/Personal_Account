'use client';

import { useActionState, useState } from 'react';
import { addTrainAction, updateTrainAction, deleteTrainAction, bulkAddTrainsAction } from '@/app/actions/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Train, Plus, Pencil, Trash2, LogOut, Shield, X, Check, Clock, MapPin, Layers } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type TrainType = {
  id: string;
  number: string;
  name: string | null;
  route: string;
  departure_time: string;
  arrival_time: string;
  type: string | null;
  created_at: string;
};

const TRAIN_TYPE_OPTIONS = [
  { value: '', label: 'Не выбран' },
  { value: 'sapsan', label: 'Сапсан' },
  { value: 'lastochka', label: 'Ласточка' },
  { value: 'skory', label: 'Скорый' },
  { value: 'passazhirsky', label: 'Пассажирский' },
  { value: 'firmenny', label: 'Фирменный' },
];

export function AdminDashboardClient({ trains, userEmail, userName }: { trains: TrainType[]; userEmail: string; userName: string | null }) {
  const [editingTrain, setEditingTrain] = useState<TrainType | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const router = useRouter();

  const [addState, addAction, addPending] = useActionState(addTrainAction, undefined);
  const [updateState, updateAction, updatePending] = useActionState(updateTrainAction, undefined);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteTrainAction, undefined);
  const [bulkState, bulkAction, bulkPending] = useActionState(bulkAddTrainsAction, undefined);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  function renderMessage(state: any) {
    if (!state) return null;
    if (state.message) {
      return (
        <div className="mb-4 bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          {state.message}
        </div>
      );
    }
    if (state.error) {
      return (
        <div className="mb-4 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg whitespace-pre-line">
          {state.error}
        </div>
      );
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Админ-панель</h1>
              <p className="text-sm text-gray-400">Управление расписанием поездов</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{userName || 'Администратор'}</p>
              <p className="text-xs text-gray-400">{userEmail}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Messages */}
        {renderMessage(addState)}
        {renderMessage(updateState)}
        {renderMessage(deleteState)}
        {renderMessage(bulkState)}

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => { setShowAddForm(!showAddForm); setShowBulkForm(false); setEditingTrain(null); }}
            className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showAddForm ? 'Отменить' : 'Добавить поезд'}
          </button>
          <button
            onClick={() => { setShowBulkForm(!showBulkForm); setShowAddForm(false); setEditingTrain(null); }}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {showBulkForm ? <X className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            {showBulkForm ? 'Отменить' : 'Массовое добавление'}
          </button>
        </div>

        {/* Add Train Form */}
        {showAddForm && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Добавить новый поезд</h2>
            <form action={addAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number" className="text-gray-300">Номер поезда *</Label>
                <Input
                  id="number"
                  name="number"
                  type="text"
                  placeholder="001А"
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Название поезда</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Сапсан"
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="text-gray-300">Тип поезда</Label>
                <select
                  id="type"
                  name="type"
                  defaultValue=""
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {TRAIN_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="departure_time" className="text-gray-300">Время отправления *</Label>
                <Input
                  id="departure_time"
                  name="departure_time"
                  type="text"
                  placeholder="06:45"
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrival_time" className="text-gray-300">Время прибытия *</Label>
                <Input
                  id="arrival_time"
                  name="arrival_time"
                  type="text"
                  placeholder="10:30"
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="route" className="text-gray-300">Маршрут *</Label>
                <Input
                  id="route"
                  name="route"
                  type="text"
                  placeholder="Москва — Санкт-Петербург"
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={addPending}
                >
                  {addPending ? 'Добавление...' : 'Добавить поезд'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Bulk Add Form */}
        {showBulkForm && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Массовое добавление поездов</h2>
            <p className="text-sm text-gray-400 mb-4">
              Добавьте несколько поездов на один маршрут с разным временем отправления.
              Время прибытия будет рассчитано автоматически на основе времени в пути.
            </p>
            <form action={bulkAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bulk-route" className="text-gray-300">Маршрут *</Label>
                <Input
                  id="bulk-route"
                  name="route"
                  type="text"
                  placeholder="Москва — Санкт-Петербург"
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk-trainName" className="text-gray-300">Название поезда</Label>
                <Input
                  id="bulk-trainName"
                  name="trainName"
                  type="text"
                  placeholder="Сапсан"
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk-trainType" className="text-gray-300">Тип поезда</Label>
                <select
                  id="bulk-trainType"
                  name="trainType"
                  defaultValue=""
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TRAIN_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk-numberPrefix" className="text-gray-300">Префикс номера *</Label>
                <Input
                  id="bulk-numberPrefix"
                  name="numberPrefix"
                  type="text"
                  placeholder="701"
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  required
                />
                <p className="text-xs text-gray-500">Номера будут сгенерированы как 70101, 70102, 70103...</p>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Время в пути</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      name="travelHours"
                      type="number"
                      min="0"
                      max="48"
                      defaultValue="4"
                      placeholder="часы"
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      name="travelMinutes"
                      type="number"
                      min="0"
                      max="59"
                      defaultValue="0"
                      placeholder="минуты"
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bulk-departureTimes" className="text-gray-300">Время отправления *</Label>
                <textarea
                  id="bulk-departureTimes"
                  name="departureTimes"
                  rows={6}
                  placeholder={`06:45\n07:30\n09:00\n10:30\n12:00\n13:30\n15:00\n16:30\n18:00\n19:30`}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 font-mono"
                  required
                />
                <p className="text-xs text-gray-500">Укажите каждое время на новой строке в формате ЧЧ:ММ</p>
              </div>
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={bulkPending}
                >
                  {bulkPending ? 'Добавление...' : 'Добавить все поезда'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Train Form */}
        {editingTrain && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Редактировать поезд</h2>
              <button
                onClick={() => setEditingTrain(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form action={updateAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="hidden" name="id" value={editingTrain.id} />
              <div className="space-y-2">
                <Label htmlFor="edit-number" className="text-gray-300">Номер поезда *</Label>
                <Input
                  id="edit-number"
                  name="number"
                  type="text"
                  defaultValue={editingTrain.number}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-gray-300">Название поезда</Label>
                <Input
                  id="edit-name"
                  name="name"
                  type="text"
                  defaultValue={editingTrain.name || ''}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type" className="text-gray-300">Тип поезда</Label>
                <select
                  id="edit-type"
                  name="type"
                  defaultValue={editingTrain.type || ''}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TRAIN_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-departure_time" className="text-gray-300">Время отправления *</Label>
                <Input
                  id="edit-departure_time"
                  name="departure_time"
                  type="text"
                  defaultValue={editingTrain.departure_time}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-arrival_time" className="text-gray-300">Время прибытия *</Label>
                <Input
                  id="edit-arrival_time"
                  name="arrival_time"
                  type="text"
                  defaultValue={editingTrain.arrival_time}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-route" className="text-gray-300">Маршрут *</Label>
                <Input
                  id="edit-route"
                  name="route"
                  type="text"
                  defaultValue={editingTrain.route}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={updatePending}
                >
                  {updatePending ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Trains List */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">
              Список поездов ({trains.length})
            </h2>
          </div>

          {trains.length > 0 ? (
            <div className="divide-y divide-gray-700">
              {trains.map((train) => (
                <div key={train.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-750 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Train className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">
                          {train.name || `Поезд №${train.number}`}
                        </h3>
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                          №{train.number}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-sm text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>{train.route}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-green-400" />
                          Отпр: {train.departure_time}
                        </span>
                        <span className="text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-orange-400" />
                          Приб: {train.arrival_time}
                        </span>
                        {train.type && (
                          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                            {train.type === 'sapsan' ? 'Сапсан' :
                             train.type === 'lastochka' ? 'Ласточка' :
                             train.type === 'skory' ? 'Скорый' :
                             train.type === 'passazhirsky' ? 'Пассажирский' :
                             train.type === 'firmenny' ? 'Фирменный' : train.type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingTrain(train); setShowAddForm(false); setShowBulkForm(false); }}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <form action={deleteAction}>
                      <input type="hidden" name="id" value={train.id} />
                      <button
                        type="submit"
                        disabled={deletePending}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Удалить"
                        onClick={(e) => {
                          if (!confirm('Вы уверены, что хотите удалить этот поезд?')) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Train className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Поезда не найдены</p>
              <p className="text-sm text-gray-500 mt-1">
                Добавьте первый поезд с помощью кнопки "Добавить поезд" или "Массовое добавление"
              </p>
            </div>
          )}
        </div>

        {/* Back to main page */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            ← На главную
          </Link>
        </div>
      </main>
    </div>
  );
}