'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestRefundAction } from '@/app/actions/refunds';
import {
  calculateRefund,
  getFeeLabel,
  getTimeUntilDepartureLabel,
} from '@/lib/refund-calculator';
import type { TicketWithDetails } from '@/lib/types';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  AlertCircle,
  Clock,
  Train,
  MapPin,
  Calendar,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RefundTicketModalProps {
  ticket: TicketWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = 'reason' | 'card' | 'confirm';

const REFUND_REASONS: { value: string; label: string }[] = [
  { value: 'change_of_plans', label: 'Изменение планов' },
  { value: 'illness', label: 'Болезнь' },
  { value: 'train_delay', label: 'Задержка поезда' },
  { value: 'wrong_ticket', label: 'Ошибка при оформлении' },
  { value: 'other', label: 'Другое' },
];

// ─── Card number formatting ──────────────────────────────────────────────────

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  const groups: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    groups.push(digits.slice(i, i + 4));
  }
  return groups.join(' ');
}

function maskCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  const last4 = digits.slice(-4);
  const masked = '**** **** **** ';
  return masked + last4;
}

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current, steps }: { current: Step; steps: Step[] }) {
  const labels: Record<Step, string> = {
    reason: 'Причина',
    card: 'Карта',
    confirm: 'Подтверждение',
  };

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, index) => {
        const stepIndex = steps.indexOf(current);
        const isActive = step === current;
        const isCompleted = steps.indexOf(step) < stepIndex;

        return (
          <div key={step} className="flex items-center gap-2">
            {index > 0 && (
              <div
                className={`w-8 h-px ${
                  isCompleted || isActive ? 'bg-red-500' : 'bg-gray-200'
                }`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isActive
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  isActive ? 'text-red-600' : 'text-gray-400'
                }`}
              >
                {labels[step]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Refund summary card ─────────────────────────────────────────────────────

function RefundSummary({
  ticket,
  calculation,
}: {
  ticket: TicketWithDetails;
  calculation: ReturnType<typeof calculateRefund>;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2.5 border border-gray-100">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Стоимость билета</span>
        <span className="font-semibold text-gray-900">
          {ticket.price.toLocaleString('ru-RU')} ₽
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          Время до отправления
        </span>
        <span className="font-medium text-gray-700">
          {getTimeUntilDepartureLabel(calculation.hoursUntilDeparture)}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">{getFeeLabel(calculation.feePercent)}</span>
        <span className="font-semibold text-red-600">
          –{calculation.feeAmount.toLocaleString('ru-RU')} ₽
        </span>
      </div>

      <div className="border-t border-gray-200 pt-2.5 mt-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">
            Итого к возврату
          </span>
          <span className="text-lg font-bold text-green-600">
            {calculation.totalRefund.toLocaleString('ru-RU')} ₽
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function RefundTicketModal({
  ticket,
  open,
  onOpenChange,
  onSuccess,
}: RefundTicketModalProps) {
  const router = useRouter();

  const [step, setStep] = useState<Step>('reason');
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const steps: Step[] = ['reason', 'card', 'confirm'];

  // ── Refund calculation (reactive) ──────────────────────────────────────────

  const calculation = useMemo(
    () => calculateRefund(ticket.price, ticket.departure_date),
    [ticket.price, ticket.departure_date],
  );

  // ── Derived values ─────────────────────────────────────────────────────────

  const finalReason = reason === 'other' ? otherReason : reason;
  const canProceedFromReason = reason !== '' && (reason !== 'other' || otherReason.trim() !== '');
  const canProceedFromCard = cardNumber.replace(/\D/g, '').length === 16;
  const isPastDeparture = calculation.isPastDeparture;

  // ── Reset state when modal opens ───────────────────────────────────────────

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // Delay reset so the closing animation plays smoothly
        setTimeout(() => {
          setStep('reason');
          setReason('');
          setOtherReason('');
          setCardNumber('');
          setError(null);
          setPending(false);
        }, 200);
      }
      onOpenChange(open);
    },
    [onOpenChange],
  );

  // ── Navigation ─────────────────────────────────────────────────────────────

  const goNext = useCallback(() => {
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  }, [step, steps]);

  const goBack = useCallback(() => {
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
  }, [step, steps]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.set('ticketId', ticket.id);
    formData.set('reason', finalReason);
    formData.set('cardNumber', cardNumber.replace(/\s/g, ''));

    const result = await requestRefundAction(undefined, formData);

    if (result?.error) {
      setError(result.error);
      setPending(false);
    } else {
      // Success — close modal, refresh, notify parent
      handleOpenChange(false);
      router.refresh();
      onSuccess?.();
    }
  }, [ticket.id, finalReason, cardNumber, handleOpenChange, router, onSuccess]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Train className="w-5 h-5 text-red-600" />
            Возврат билета
          </DialogTitle>
          <DialogDescription>
            {ticket.train?.name || `Поезд №${ticket.train?.number}`} ·{' '}
            {ticket.station_from_id} → {ticket.station_to_id}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <StepIndicator current={step} steps={steps} />

        {/* ────────────── STEP 1: REASON ────────────── */}
        {step === 'reason' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refund-reason">Причина возврата</Label>
              <select
                id="refund-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                required
              >
                <option value="">Выберите причину</option>
                {REFUND_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {reason === 'other' && (
              <div className="space-y-2">
                <Label htmlFor="other-reason">Уточните причину</Label>
                <Input
                  id="other-reason"
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  placeholder="Опишите причину возврата"
                />
              </div>
            )}

            {/* Quick info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                Возврат возможен только для оплаченных или оформленных билетов.
                Сумма возврата рассчитывается исходя из времени, оставшегося до
                отправления поезда.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={goNext} disabled={!canProceedFromReason}>
                Далее
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ────────────── STEP 2: CARD NUMBER ────────────── */}
        {step === 'card' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refund-card">Номер карты для возврата</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="refund-card"
                  value={formatCardNumber(cardNumber)}
                  onChange={(e) => {
                    // Allow only digits and spaces (from formatting)
                    const raw = e.target.value.replace(/\D/g, '');
                    setCardNumber(raw);
                  }}
                  placeholder="0000 0000 0000 0000"
                  className="pl-10 font-mono tracking-wider"
                  maxLength={19} // 16 digits + 3 spaces
                />
              </div>
              <p className="text-xs text-gray-400">
                Введите 16 цифр номера банковской карты
              </p>
            </div>

            {/* Preview masked card */}
            {cardNumber.replace(/\D/g, '').length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Возврат на карту:</p>
                <p className="text-sm font-mono font-semibold text-gray-900">
                  {maskCardNumber(cardNumber)}
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Назад
              </Button>
              <Button onClick={goNext} disabled={!canProceedFromCard}>
                Далее
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ────────────── STEP 3: CONFIRM ────────────── */}
        {step === 'confirm' && (
          <div className="space-y-4">
            {/* Ticket summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {ticket.station_from_id} → {ticket.station_to_id}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {new Date(ticket.departure_date).toLocaleDateString('ru-RU', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-xs">🚃</span>
                <span>
                  Вагон №{ticket.wagon_number} · Место {ticket.seat_number}
                </span>
              </div>
            </div>

            {/* Refund calculation */}
            <RefundSummary ticket={ticket} calculation={calculation} />

            {/* Reason summary */}
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-100">
              <span className="font-medium text-gray-700">Причина:</span>{' '}
              {REFUND_REASONS.find((r) => r.value === reason)?.label ?? reason}
              {reason === 'other' && otherReason && ` — ${otherReason}`}
            </div>

            {/* Card summary */}
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-medium text-gray-700">Возврат на карту:</span>{' '}
              {maskCardNumber(cardNumber)}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack} disabled={pending}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Назад
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={pending || isPastDeparture}
                variant={isPastDeparture ? 'outline' : 'destructive'}
              >
                {pending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-1" />
                    Отправка...
                  </>
                ) : isPastDeparture ? (
                  'Возврат невозможен'
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Подтвердить возврат
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}