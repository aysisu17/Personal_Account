'use server';

import { createClient } from '@/lib/supabase/server';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface YearAnalytics {
  /** Total number of trips (completed + completed refunds) in the current year */
  totalTrips: number;
  /** Total money spent on tickets this year (price - discounts) */
  totalSpent: number;
  /** Total bonus points earned this year */
  totalBonusEarned: number;
  /** Total bonus points used this year */
  totalBonusUsed: number;
  /** Money saved by using bonuses (1 bonus = 1 RUB) */
  totalBonusSavings: number;
  /** Money saved from promocodes and special tariffs (sum of discount_amount) */
  totalDiscountSavings: number;
  /** Total savings (bonus savings + discount savings) */
  totalSavings: number;
  /** Total money refunded this year */
  totalRefunded: number;
  /** Number of refunds this year */
  totalRefunds: number;
  /** Average ticket price this year */
  averageTicketPrice: number;
  /** Most popular month (1-12) */
  mostActiveMonth: number | null;
  /** Trips per month (array of 12 numbers) */
  tripsByMonth: number[];
  /** Spending per month (array of 12 numbers) */
  spendingByMonth: number[];
  /** Year for which data is calculated */
  year: number;
}

// ─── Server action ───────────────────────────────────────────────────────────

export async function getYearAnalytics(year?: number): Promise<YearAnalytics> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return getEmptyAnalytics(year);
  }

  const targetYear = year ?? new Date().getFullYear();
  const startDate = `${targetYear}-01-01`;
  const endDate = `${targetYear + 1}-01-01`;

  // ── 1. Fetch all tickets for the year ──────────────────────────────────────

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', user.id)
    .gte('departure_date', startDate)
    .lt('departure_date', endDate);

  if (!tickets || tickets.length === 0) {
    return getEmptyAnalytics(targetYear);
  }

  // ── 2. Fetch refund requests for the year ──────────────────────────────────

  const { data: refunds } = await supabase
    .from('refund_requests')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', startDate)
    .lt('created_at', endDate);

  // ── 3. Calculate metrics ───────────────────────────────────────────────────

  // Completed trips (status = completed or refund_approved)
  const completedTrips = tickets.filter(
    (t) => t.status === 'completed' || t.status === 'refund_approved',
  );

  // Total spent = sum of (price - discount_amount) for paid/issued/completed tickets
  const paidTickets = tickets.filter(
    (t) =>
      t.status === 'paid' ||
      t.status === 'issued' ||
      t.status === 'completed' ||
      t.status === 'refund_requested',
  );
  const totalSpent = paidTickets.reduce(
    (sum, t) => sum + (t.price - (t.discount_amount || 0)),
    0,
  );

  // Bonus earned from tickets
  const totalBonusEarned = tickets.reduce(
    (sum, t) => sum + (t.bonus_earned || 0),
    0,
  );

  // Bonus used from tickets
  const totalBonusUsed = tickets.reduce(
    (sum, t) => sum + (t.bonus_used || 0),
    0,
  );

  // Savings from bonuses (1 bonus = 1 RUB)
  const totalBonusSavings = totalBonusUsed;

  // Savings from promocodes / special tariffs (sum of discount_amount)
  const totalDiscountSavings = paidTickets.reduce(
    (sum, t) => sum + (t.discount_amount || 0),
    0,
  );

  // Total savings (bonuses + discounts)
  const totalSavings = totalBonusSavings + totalDiscountSavings;

  // Refunds
  const approvedRefunds = (refunds ?? []).filter(
    (r) => r.status === 'approved',
  );
  const totalRefunded = approvedRefunds.reduce(
    (sum, r) => sum + (r.total_refund || 0),
    0,
  );

  // Average ticket price
  const averageTicketPrice =
    paidTickets.length > 0
      ? Math.round(totalSpent / paidTickets.length)
      : 0;

  // ── 4. Monthly breakdown ───────────────────────────────────────────────────

  const tripsByMonth = new Array(12).fill(0);
  const spendingByMonth = new Array(12).fill(0);

  for (const ticket of paidTickets) {
    const month = new Date(ticket.departure_date).getMonth(); // 0-11
    spendingByMonth[month] += ticket.price - (ticket.discount_amount || 0);
  }

  for (const ticket of completedTrips) {
    const month = new Date(ticket.departure_date).getMonth();
    tripsByMonth[month] += 1;
  }

  // Most active month
  let mostActiveMonth: number | null = null;
  let maxTrips = 0;
  for (let i = 0; i < 12; i++) {
    if (tripsByMonth[i] > maxTrips) {
      maxTrips = tripsByMonth[i];
      mostActiveMonth = i + 1; // 1-12
    }
  }

  return {
    totalTrips: completedTrips.length,
    totalSpent,
    totalBonusEarned,
    totalBonusUsed,
    totalBonusSavings,
    totalDiscountSavings,
    totalSavings,
    totalRefunded,
    totalRefunds: approvedRefunds.length,
    averageTicketPrice,
    mostActiveMonth,
    tripsByMonth,
    spendingByMonth,
    year: targetYear,
  };
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function getEmptyAnalytics(year?: number): YearAnalytics {
  return {
    totalTrips: 0,
    totalSpent: 0,
    totalBonusEarned: 0,
    totalBonusUsed: 0,
    totalBonusSavings: 0,
    totalDiscountSavings: 0,
    totalSavings: 0,
    totalRefunded: 0,
    totalRefunds: 0,
    averageTicketPrice: 0,
    mostActiveMonth: null,
    tripsByMonth: new Array(12).fill(0),
    spendingByMonth: new Array(12).fill(0),
    year: year ?? new Date().getFullYear(),
  };
}
