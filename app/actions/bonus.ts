'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getBonusAccount() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: account } = await supabase
    .from('bonus_accounts')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return account;
}

export async function getBonusTransactions(limit = 50) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: account } = await supabase
    .from('bonus_accounts')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!account) return [];

  const { data: transactions } = await supabase
    .from('bonus_transactions')
    .select('*')
    .eq('account_id', account.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  return transactions ?? [];
}

export async function creditTripAction(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Необходимо авторизоваться' };
  }

  const trainNumber = formData.get('trainNumber') as string;
  const route = formData.get('route') as string;
  const departureDate = formData.get('departureDate') as string;
  const ticketPrice = parseFloat(formData.get('ticketPrice') as string);

  if (!trainNumber || !route || !departureDate || !ticketPrice) {
    return { success: false, error: 'Все поля обязательны' };
  }

  if (ticketPrice <= 0) {
    return { success: false, error: 'Стоимость билета должна быть положительной' };
  }

  // Calculate bonus accrual (1 point per 100 RUB for base level)
  const bonusEarned = Math.floor(ticketPrice / 100);

  // Get bonus account
  const { data: account } = await supabase
    .from('bonus_accounts')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!account) {
    return { success: false, error: 'Бонусный счёт не найден' };
  }

  // Update balance
  const { error: updateError } = await supabase
    .from('bonus_accounts')
    .update({
      premium_balance: account.premium_balance + bonusEarned,
      qualification_balance: account.qualification_balance + bonusEarned,
      total_miles: account.total_miles + bonusEarned,
      level_progress: Math.min(100, ((account.total_miles + bonusEarned) / 2000) * 100),
    })
    .eq('id', account.id);

  if (updateError) {
    return { success: false, error: 'Ошибка при начислении баллов' };
  }

  // Create transaction record
  await supabase.from('bonus_transactions').insert({
    user_id: user.id,
    account_id: account.id,
    type: 'accrual',
    amount: bonusEarned,
    balance_type: 'premium',
    reason: 'manual',
    description: `Зачёт поездки ${trainNumber} ${route} от ${new Date(departureDate).toLocaleDateString('ru-RU')}`,
  });

  // Create notification
  await supabase.from('notifications').insert({
    user_id: user.id,
    title: 'Баллы начислены',
    message: `За поездку ${trainNumber} начислено ${bonusEarned} баллов`,
    channel: 'push',
    topic: 'bonus_accrual',
  });

  revalidatePath('/bonus');
  return { success: true, message: `Поездка зачтена! Начислено ${bonusEarned} баллов` };
}

export async function calculateBonusForTrip(price: number, level: string) {
  const multipliers: Record<string, number> = {
    base: 1,
    silver: 1.25,
    gold: 1.5,
    platinum: 2,
  };

  const multiplier = multipliers[level] || 1;
  return Math.floor(price / 100 * multiplier);
}

export async function getBonusLevelInfo(level: string) {
  const levels: Record<string, { name: string; nextLevel: string | null; milesToNext: number | null }> = {
    base: { name: 'Базовый', nextLevel: 'Серебряный', milesToNext: 2000 },
    silver: { name: 'Серебряный', nextLevel: 'Золотой', milesToNext: 10000 },
    gold: { name: 'Золотой', nextLevel: 'Платиновый', milesToNext: 50000 },
    platinum: { name: 'Платиновый', nextLevel: null, milesToNext: null },
  };

  return levels[level] || levels.base;
}