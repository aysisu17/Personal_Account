'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getNotifications(limit = 20) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  return notifications ?? [];
}

export async function getUnreadNotificationCount() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false);

  return count ?? 0;
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient();

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  revalidatePath('/notifications');
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);

  revalidatePath('/notifications');
}

export async function getNotificationSettings() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: settings } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', user.id);

  return settings ?? [];
}

export async function updateNotificationSettingAction(settingId: string, enabled: boolean) {
  const supabase = await createClient();

  await supabase
    .from('notification_settings')
    .update({ enabled })
    .eq('id', settingId);

  revalidatePath('/profile');
}

export async function createNotification(userId: string, title: string, message: string, topic: string) {
  const supabase = await createClient();

  await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    channel: 'push',
    topic,
  });
}