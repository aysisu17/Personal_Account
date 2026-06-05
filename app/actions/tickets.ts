'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function buyTicketAction(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Необходимо авторизоваться' };
  }

  const trainId = formData.get('trainId') as string;
  const stationFromName = formData.get('stationFromName') as string;
  const stationToName = formData.get('stationToName') as string;
  const departureDate = formData.get('departureDate') as string;
  const arrivalDate = formData.get('arrivalDate') as string;
  const seatNumber = formData.get('seatNumber') as string;
  const seatType = formData.get('seatType') as string;
  const wagonNumber = formData.get('wagonNumber') as string;
  const wagonCategory = formData.get('wagonCategory') as string;
  const price = parseFloat(formData.get('price') as string);
  const useBonus = formData.get('useBonus') === 'true';
  const bonusAmount = parseInt(formData.get('bonusAmount') as string) || 0;

  if (!trainId || !stationFromName || !stationToName || !seatNumber || !price) {
    return { success: false, error: 'Все поля обязательны' };
  }

  let finalPrice = price;
  let bonusUsed = 0;
  let bonusEarned = Math.floor(price / 100);

  // Apply bonus if requested
  if (useBonus && bonusAmount > 0) {
    const { data: account } = await supabase
      .from('bonus_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (account && account.premium_balance >= bonusAmount) {
      bonusUsed = Math.min(bonusAmount, Math.floor(price * 0.5)); // Max 50% of ticket price
      finalPrice = price - bonusUsed;

      // Deduct bonus
      await supabase
        .from('bonus_accounts')
        .update({
          premium_balance: account.premium_balance - bonusUsed,
        })
        .eq('id', account.id);

      // Record bonus transaction
      await supabase.from('bonus_transactions').insert({
        user_id: user.id,
        account_id: account.id,
        type: 'write_off',
        amount: bonusUsed,
        balance_type: 'premium',
        reason: 'trip',
        description: `Оплата части билета №${trainId}`,
      });
    }
  }

  // Create ticket
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .insert({
      user_id: user.id,
      train_id: trainId,
      station_from_id: stationFromName,
      station_to_id: stationToName,
      departure_date: departureDate,
      arrival_date: arrivalDate || null,
      seat_number: seatNumber,
      seat_type: seatType || 'seated',
      wagon_number: wagonNumber || '1',
      wagon_category: wagonCategory || 'economy',
      price: finalPrice,
      discount_amount: bonusUsed,
      bonus_used: bonusUsed,
      bonus_earned: bonusEarned,
      status: 'paid',
      is_electronic: true,
    })
    .select()
    .single();

  if (ticketError) {
    console.error('Error creating ticket:', JSON.stringify(ticketError, null, 2));
    // Provide more specific error message based on the error
    if (ticketError.message?.includes('relation') && ticketError.message?.includes('does not exist')) {
      return { success: false, error: 'Таблица билетов не найдена. Пожалуйста, выполните SQL-скрипт из supabase/migrations/001_create_trains_table.sql в SQL Editor Supabase.' };
    }
    if (ticketError.message?.includes('violates foreign key constraint')) {
      return { success: false, error: 'Ошибка привязки станции. Убедитесь, что станции существуют в базе.' };
    }
    if (ticketError.message?.includes('column') && ticketError.message?.includes('is of type uuid')) {
      return { success: false, error: 'Ошибка типа данных: станции должны быть UUID. Выполните SQL-скрипт для обновления таблицы.' };
    }
    if (ticketError.message?.includes('permission denied') || ticketError.message?.includes('violates row-level security')) {
      return { success: false, error: 'Ошибка доступа. Проверьте настройки Row Level Security в Supabase.' };
    }
    return { success: false, error: `Ошибка при покупке билета: ${ticketError.message || 'неизвестная ошибка'}` };
  }

  // Create booking
  const { error: bookingError } = await supabase.from('bookings').insert({
    user_id: user.id,
    ticket_id: ticket.id,
    status: 'confirmed',
  });

  if (bookingError) {
    console.error('Error creating booking:', bookingError);
  }

  // Create notification
  await supabase.from('notifications').insert({
    user_id: user.id,
    title: 'Билет куплен',
    message: `Билет №${ticket.id} на поезд успешно оплачен. Стоимость: ${finalPrice} ₽`,
    channel: 'push',
    topic: 'purchase',
  });

  revalidatePath('/tickets');
  return { success: true, ticketId: ticket.id };
}

export async function cancelTicketAction(ticketId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Необходимо авторизоваться' };
  }

  // Update ticket status
  const { error: ticketError } = await supabase
    .from('tickets')
    .update({ status: 'cancelled' })
    .eq('id', ticketId)
    .eq('user_id', user.id);

  if (ticketError) {
    console.error('Error cancelling ticket:', ticketError);
    return { success: false, error: 'Ошибка при отмене билета' };
  }

  // Update booking status
  await supabase
    .from('bookings')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('ticket_id', ticketId);

  // Create notification
  await supabase.from('notifications').insert({
    user_id: user.id,
    title: 'Билет отменён',
    message: `Билет №${ticketId} был отменён`,
    channel: 'push',
    topic: 'status_change',
  });

  revalidatePath('/tickets');
  revalidatePath(`/tickets/${ticketId}`);

  return { success: true };
}

export async function getMyTickets(searchQuery?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  let query = supabase
    .from('tickets')
    .select(`
      *,
      train:trains(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Apply search filter if provided
  if (searchQuery) {
    const searchLower = searchQuery.toLowerCase();
    query = query.or(
      `id.ilike.%${searchLower}%,` +
      `departure_date.ilike.%${searchLower}%,` +
      `train.number.ilike.%${searchLower}%`
    );
  }

  const { data: tickets } = await query;

  return tickets ?? [];
}

export async function getTicketById(ticketId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: ticket } = await supabase
    .from('tickets')
    .select(`
      *,
      train:trains(*)
    `)
    .eq('id', ticketId)
    .eq('user_id', user.id)
    .single();

  return ticket;
}

export async function getMyBookings() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      ticket:tickets(
        *,
        train:trains(*)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return bookings ?? [];
}

export async function getTripHistory(
  period?: string,
  stationFrom?: string,
  stationTo?: string,
  trainNumber?: string,
  wagonCategory?: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  let query = supabase
    .from('tickets')
    .select(`
      *,
      train:trains(*)
    `)
    .eq('user_id', user.id)
    .in('status', ['completed', 'cancelled', 'refund_approved', 'refund_rejected'])
    .order('departure_date', { ascending: false });

  // Filter by period
  if (period) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }

    query = query.gte('departure_date', startDate.toISOString());
  }

  // Filter by station
  if (stationFrom) {
    query = query.eq('station_from_id', stationFrom);
  }
  if (stationTo) {
    query = query.eq('station_to_id', stationTo);
  }

  // Filter by train number
  if (trainNumber) {
    query = query.ilike('train.number', `%${trainNumber}%`);
  }

  // Filter by wagon category
  if (wagonCategory) {
    query = query.eq('wagon_category', wagonCategory);
  }

  const { data: tickets } = await query;
  return tickets ?? [];
}