'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function requestRefundAction(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Необходимо авторизоваться' };
  }

  const ticketId = formData.get('ticketId') as string;
  const reason = formData.get('reason') as string;
  const cardNumber = formData.get('cardNumber') as string;

  if (!ticketId || !reason || !cardNumber) {
    return { success: false, error: 'Все поля обязательны' };
  }

  // Get ticket details
  const { data: ticket } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .eq('user_id', user.id)
    .single();

  if (!ticket) {
    return { success: false, error: 'Билет не найден' };
  }

  if (ticket.status !== 'paid' && ticket.status !== 'issued') {
    return { success: false, error: 'Возврат возможен только для оплаченных или оформленных билетов' };
  }

  // Calculate refund amount
  // If more than 24 hours before departure - full refund minus fee
  // If less than 24 hours - partial refund
  const departureDate = new Date(ticket.departure_date);
  const now = new Date();
  const hoursUntilDeparture = (departureDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  let feePercent = 0;
  if (hoursUntilDeparture > 24) {
    feePercent = 5; // 5% fee
  } else if (hoursUntilDeparture > 2) {
    feePercent = 20; // 20% fee
  } else {
    feePercent = 50; // 50% fee
  }

  const feeAmount = Math.round(ticket.price * feePercent / 100);
  const totalRefund = ticket.price - feeAmount;

  // Create refund request
  const { data: refund, error: refundError } = await supabase
    .from('refund_requests')
    .insert({
      user_id: user.id,
      ticket_id: ticketId,
      reason,
      refund_amount: ticket.price,
      fee_amount: feeAmount,
      total_refund: totalRefund,
      card_number: cardNumber,
      status: 'pending',
    })
    .select()
    .single();

  if (refundError) {
    return { success: false, error: 'Ошибка при создании запроса на возврат' };
  }

  // Update ticket status
  await supabase
    .from('tickets')
    .update({ status: 'refund_requested' })
    .eq('id', ticketId);

  // Create notification
  await supabase.from('notifications').insert({
    user_id: user.id,
    title: 'Запрос на возврат',
    message: `Запрос на возврат билета №${ticketId} отправлен. Сумма возврата: ${totalRefund} ₽`,
    channel: 'push',
    topic: 'refund',
  });

  revalidatePath('/tickets');
  revalidatePath(`/tickets/${ticketId}`);

  return {
    success: true,
    message: `Запрос на возврат отправлен. Сумма к возврату: ${totalRefund} ₽ (сбор: ${feeAmount} ₽)`,
    refund,
  };
}

export async function getRefundHistory() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: refunds } = await supabase
    .from('refund_requests')
    .select(`
      *,
      ticket:tickets(
        *,
        train:trains(*),
        station_from:stations!tickets_station_from_id_fkey(*),
        station_to:stations!tickets_station_to_id_fkey(*)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return refunds ?? [];
}

export async function getRefundByTicketId(ticketId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: refund } = await supabase
    .from('refund_requests')
    .select('*')
    .eq('ticket_id', ticketId)
    .eq('user_id', user.id)
    .single();

  return refund;
}