'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cancelTicketAction } from '@/app/actions/tickets';
import { requestRefundAction } from '@/app/actions/refunds';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Train, MapPin, Calendar, CreditCard, ArrowLeft, Download, Printer } from 'lucide-react';
import Link from 'next/link';
import { TicketWithDetails, TICKET_STATUS_LABELS, TICKET_STATUS_COLORS, WAGON_CATEGORIES, SEAT_TYPES } from '@/lib/types';

interface TicketDetailsProps {
  ticket: TicketWithDetails;
}

export function TicketDetails({ ticket }: TicketDetailsProps) {
  const router = useRouter();
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundSuccess, setRefundSuccess] = useState<string | null>(null);
  const [refundPending, setRefundPending] = useState(false);

  async function handleCancel() {
    if (!confirm('Вы уверены, что хотите отменить билет?')) return;

    const result = await cancelTicketAction(ticket.id);
    if (result.success) {
      router.refresh();
    }
  }

  async function handleRefund(formData: FormData) {
    setRefundPending(true);
    setRefundError(null);
    setRefundSuccess(null);

    formData.set('ticketId', ticket.id);

    const result = await requestRefundAction(undefined, formData);

    if (result?.error) {
      setRefundError(result.error);
    } else if (result?.message) {
      setRefundSuccess(result.message);
    }

    setRefundPending(false);
  }

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Контрольный купон - Билет №${ticket.id}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              .header { text-align: center; margin-bottom: 30px; }
              .header h1 { color: #E31E24; margin: 0; }
              .info { margin-bottom: 15px; }
              .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
              .label { color: #666; }
              .value { font-weight: bold; }
              .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>РЖД</h1>
              <p>Контрольный купон электронного билета</p>
            </div>
            <div class="info">
              <div class="info-row"><span class="label">Номер билета:</span><span class="value">${ticket.id}</span></div>
              <div class="info-row"><span class="label">Поезд:</span><span class="value">${ticket.train?.name || ticket.train?.number} (${ticket.train?.route})</span></div>
              <div class="info-row"><span class="label">Маршрут:</span><span class="value">${ticket.station_from_id} → ${ticket.station_to_id}</span></div>
              <div class="info-row"><span class="label">Дата отправления:</span><span class="value">${new Date(ticket.departure_date).toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
              <div class="info-row"><span class="label">Вагон:</span><span class="value">№${ticket.wagon_number} (${WAGON_CATEGORIES[ticket.wagon_category] || ticket.wagon_category})</span></div>
              <div class="info-row"><span class="label">Место:</span><span class="value">${ticket.seat_number} (${SEAT_TYPES[ticket.seat_type] || ticket.seat_type})</span></div>
              <div class="info-row"><span class="label">Стоимость:</span><span class="value">${ticket.price.toLocaleString('ru-RU')} ₽</span></div>
              ${ticket.bonus_used > 0 ? `<div class="info-row"><span class="label">Списано баллов:</span><span class="value">${ticket.bonus_used}</span></div>` : ''}
              <div class="info-row"><span class="label">Статус:</span><span class="value">${TICKET_STATUS_LABELS[ticket.status]}</span></div>
              <div class="info-row"><span class="label">Тип билета:</span><span class="value">${ticket.is_electronic ? 'Электронный' : 'Бумажный'}</span></div>
            </div>
            <div class="footer">
              <p>Данный купон является контрольным документом. При посадке предъявите его вместе с документом, удостоверяющим личность.</p>
              <p>Сгенерировано: ${new Date().toLocaleString('ru-RU')}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  const canRefund = ticket.status === 'paid' || ticket.status === 'issued';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к билетам
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <Download className="w-4 h-4" />
            Скачать
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <Printer className="w-4 h-4" />
            Распечатать
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center">
              <Train className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {ticket.train?.name || `Поезд №${ticket.train?.number}`}
              </h2>
              <p className="text-gray-500">{ticket.train?.route}</p>
            </div>
          </div>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${TICKET_STATUS_COLORS[ticket.status] || 'bg-gray-100 text-gray-600'}`}>
            {TICKET_STATUS_LABELS[ticket.status] || ticket.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Маршрут</p>
                <p className="font-medium text-gray-900">
                  {ticket.station_from_id} → {ticket.station_to_id}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Дата и время отправления</p>
                <p className="font-medium text-gray-900">
                  {new Date(ticket.departure_date).toLocaleDateString('ru-RU', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-5 h-5 text-gray-400 flex items-center justify-center">🚃</span>
              <div>
                <p className="text-sm text-gray-500">Вагон</p>
                <p className="font-medium text-gray-900">
                  №{ticket.wagon_number} · {WAGON_CATEGORIES[ticket.wagon_category] || ticket.wagon_category}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 text-gray-400 flex items-center justify-center">💺</span>
              <div>
                <p className="text-sm text-gray-500">Место</p>
                <p className="font-medium text-gray-900">
                  {ticket.seat_number} · {SEAT_TYPES[ticket.seat_type] || ticket.seat_type}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Стоимость</p>
                <p className="font-medium text-gray-900">
                  {ticket.price.toLocaleString('ru-RU')} ₽
                </p>
                {ticket.bonus_used > 0 && (
                  <p className="text-xs text-green-600">
                    Списано {ticket.bonus_used} баллов
                  </p>
                )}
                {ticket.bonus_earned > 0 && (
                  <p className="text-xs text-blue-600">
                    Начислено {ticket.bonus_earned} баллов
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-5 h-5 text-gray-400 flex items-center justify-center">📄</span>
              <div>
                <p className="text-sm text-gray-500">Тип билета</p>
                <p className="font-medium text-gray-900">
                  {ticket.is_electronic ? 'Электронный билет (распечатка не требуется)' : 'Бумажный билет'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
          {canRefund && !showRefundForm && (
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={() => setShowRefundForm(true)}
              >
                Вернуть билет
              </Button>
            </div>
          )}

          {ticket.status === 'cancelled' && (
            <p className="text-sm text-gray-500">Билет отменён</p>
          )}

          {ticket.status === 'completed' && (
            <p className="text-sm text-gray-500">Поездка завершена</p>
          )}
        </div>

        {/* Refund Form */}
        {showRefundForm && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Форма возврата билета</h3>

            <form action={handleRefund} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Причина возврата</Label>
                <select
                  id="reason"
                  name="reason"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Выберите причину</option>
                  <option value="change_of_plans">Изменение планов</option>
                  <option value="illness">Болезнь</option>
                  <option value="train_delay">Задержка поезда</option>
                  <option value="wrong_ticket">Ошибка при оформлении</option>
                  <option value="other">Другое</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardNumber">Номер карты для возврата</Label>
                <Input
                  id="cardNumber"
                  name="cardNumber"
                  type="text"
                  placeholder="**** **** **** 1234"
                  required
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-600">
                  Стоимость билета: <span className="font-semibold">{ticket.price.toLocaleString('ru-RU')} ₽</span>
                </p>
                <p className="text-sm text-gray-600">
                  Сбор за возврат: <span className="font-semibold text-red-600">
                    {ticket.price >= 5000
                      ? `${Math.round(ticket.price * 0.05).toLocaleString('ru-RU')} ₽ (5%)`
                      : `${Math.round(ticket.price * 0.2).toLocaleString('ru-RU')} ₽ (20%)`}
                  </span>
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  Итого к возврату: <span className="text-green-600">
                    {ticket.price >= 5000
                      ? (ticket.price - Math.round(ticket.price * 0.05)).toLocaleString('ru-RU')
                      : (ticket.price - Math.round(ticket.price * 0.2)).toLocaleString('ru-RU')} ₽
                  </span>
                </p>
              </div>

              {refundError && (
                <p className="text-sm text-red-500">{refundError}</p>
              )}
              {refundSuccess && (
                <p className="text-sm text-green-600">{refundSuccess}</p>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={refundPending}>
                  {refundPending ? 'Отправка...' : 'Отправить запрос'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowRefundForm(false); setRefundError(null); }}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}