'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfileAction(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Необходимо авторизоваться' };
  }

  const fullName = formData.get('fullName') as string;
  const phone = formData.get('phone') as string;
  const birthDate = formData.get('birthDate') as string;

  if (!fullName) {
    return { success: false, error: 'ФИО обязательно' };
  }

  // Validate phone if provided
  if (phone && !/^(\+7|8)?[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/.test(phone.replace(/\s/g, ''))) {
    return { success: false, error: 'Неверный формат номера телефона' };
  }

  // Validate birth date if provided
  if (birthDate) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthDate)) {
      return { success: false, error: 'Неверный формат даты рождения' };
    }
    const parsed = new Date(birthDate);
    if (isNaN(parsed.getTime())) {
      return { success: false, error: 'Неверная дата рождения' };
    }
    if (parsed > new Date()) {
      return { success: false, error: 'Дата рождения не может быть в будущем' };
    }
  }

  // Update auth metadata
  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: fullName, phone, birth_date: birthDate },
  });

  if (authError) {
    return { success: false, error: 'Ошибка при обновлении профиля. Попробуйте позже.' };
  }

  // Update profile in users table
  const { error: dbError } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      phone: phone || null,
      birth_date: birthDate || null,
    })
    .eq('id', user.id);

  if (dbError) {
    console.error('Error updating profile:', dbError);
  }

  revalidatePath('/profile');

  return { success: true, message: 'Профиль успешно обновлён' };
}

export async function changePasswordAction(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: 'Все поля обязательны' };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'Новые пароли не совпадают' };
  }

  if (newPassword.length < 6) {
    return { success: false, error: 'Новый пароль должен быть не менее 6 символов' };
  }

  // Verify current password
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return { success: false, error: 'Не удалось получить данные пользователя' };
  }

  // Check if email verification was completed
  const { isCodeVerifiedAction } = await import('./verification');
  const isVerified = await isCodeVerifiedAction();
  if (!isVerified) {
    return { success: false, error: 'Необходимо подтвердить смену пароля через код из email' };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return { success: false, error: 'Текущий пароль неверен' };
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Clear verification after successful password change
  const { clearVerificationAction } = await import('./verification');
  await clearVerificationAction();

  revalidatePath('/profile');
  return { success: true, message: 'Пароль успешно изменён' };
}

export async function linkCardAction(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Необходимо авторизоваться' };
  }

  const cardNumber = formData.get('cardNumber') as string;
  const cardHolder = formData.get('cardHolder') as string;
  const expiryDate = formData.get('expiryDate') as string;

  if (!cardNumber || !cardHolder || !expiryDate) {
    return { success: false, error: 'Все поля обязательны' };
  }

  // Basic card validation
  const cleanNumber = cardNumber.replace(/\s/g, '');
  if (cleanNumber.length !== 16 || !/^\d+$/.test(cleanNumber)) {
    return { success: false, error: 'Неверный номер карты' };
  }

  if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
    return { success: false, error: 'Неверный формат срока действия (ММ/ГГ)' };
  }

  // Mask card number
  const maskedNumber = `${cleanNumber.slice(0, 4)} **** **** ${cleanNumber.slice(-4)}`;

  const { error } = await supabase.from('linked_cards').insert({
    user_id: user.id,
    card_number: maskedNumber,
    card_holder: cardHolder,
    expiry_date: expiryDate,
    is_default: false,
  });

  if (error) {
    return { success: false, error: 'Ошибка при привязке карты' };
  }

  revalidatePath('/profile');
  return { success: true, message: 'Карта успешно привязана' };
}

export async function unlinkCardAction(cardId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Необходимо авторизоваться' };
  }

  await supabase
    .from('linked_cards')
    .delete()
    .eq('id', cardId)
    .eq('user_id', user.id);

  revalidatePath('/profile');
  return { success: true };
}

export async function getLinkedCards() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: cards } = await supabase
    .from('linked_cards')
    .select('*')
    .eq('user_id', user.id);

  return cards ?? [];
}

export async function updateSubscriptionAction(subscriptionId: string, enabled: boolean) {
  const supabase = await createClient();

  await supabase
    .from('subscriptions')
    .update({ enabled })
    .eq('id', subscriptionId);

  revalidatePath('/profile');
}

export async function getSubscriptions() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id);

  return subscriptions ?? [];
}