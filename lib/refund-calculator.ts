/**
 * Refund calculator — shared between server actions and client components.
 * Calculates refund amount based on time remaining until departure.
 *
 * Rules:
 * - >24 hours before departure: 5% fee
 * - 2-24 hours before departure: 20% fee
 * - <2 hours before departure: 50% fee
 */

export interface RefundCalculation {
  feePercent: number;
  feeAmount: number;
  totalRefund: number;
  hoursUntilDeparture: number;
  isPastDeparture: boolean;
}

export function calculateRefund(
  price: number,
  departureDate: string,
): RefundCalculation {
  const departure = new Date(departureDate);
  const now = new Date();
  const hoursUntilDeparture =
    (departure.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilDeparture <= 0) {
    return {
      feePercent: 100,
      feeAmount: price,
      totalRefund: 0,
      hoursUntilDeparture: 0,
      isPastDeparture: true,
    };
  }

  let feePercent: number;
  if (hoursUntilDeparture > 24) {
    feePercent = 5;
  } else if (hoursUntilDeparture > 2) {
    feePercent = 20;
  } else {
    feePercent = 50;
  }

  const feeAmount = Math.round((price * feePercent) / 100);
  const totalRefund = price - feeAmount;

  return {
    feePercent,
    feeAmount,
    totalRefund,
    hoursUntilDeparture: Math.round(hoursUntilDeparture * 10) / 10,
    isPastDeparture: false,
  };
}

/**
 * Human-readable label for the fee percentage.
 */
export function getFeeLabel(feePercent: number): string {
  const labels: Record<number, string> = {
    5: 'Сбор 5% (более 24 ч до отправления)',
    20: 'Сбор 20% (менее 24 ч до отправления)',
    50: 'Сбор 50% (менее 2 ч до отправления)',
    100: 'Возврат невозможен (поездка уже началась)',
  };
  return labels[feePercent] ?? `Сбор ${feePercent}%`;
}

/**
 * Human-readable label for hours until departure.
 */
export function getTimeUntilDepartureLabel(hours: number): string {
  if (hours <= 0) return 'Поездка уже началась';
  if (hours < 1) return `${Math.round(hours * 60)} минут`;
  if (hours < 24) return `${Math.floor(hours)} ч ${Math.round((hours % 1) * 60)} мин`;
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return `${days} д ${remainingHours} ч`;
}