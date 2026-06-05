'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type AuthState = {
  success: boolean;
  error?: string;
  message?: string;
} | undefined;

export async function signInAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email и пароль обязательны' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: 'Неверный email или пароль' };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signInWithBonusAccountAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();

  const bonusAccount = formData.get('bonusAccount') as string;
  const password = formData.get('password') as string;

  if (!bonusAccount || !password) {
    return { success: false, error: 'Номер счёта и пароль обязательны' };
  }

  // Look up user by bonus account number
  const { data: userData, error: lookupError } = await supabase
    .from('users')
    .select('email')
    .eq('bonus_account', bonusAccount)
    .single();

  if (lookupError || !userData) {
    return { success: false, error: 'Неверный номер счёта или пароль' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: userData.email,
    password,
  });

  if (error) {
    return { success: false, error: 'Неверный номер счёта или пароль' };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signUpAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const phone = formData.get('phone') as string;
  const birthDate = formData.get('birthDate') as string;
  const consent = formData.get('consent') as string;

  if (!email || !password || !fullName) {
    return { success: false, error: 'Все поля обязательны' };
  }

  if (!consent) {
    return { success: false, error: 'Необходимо согласие на обработку персональных данных' };
  }

  if (password.length < 6) {
    return { success: false, error: 'Пароль должен быть не менее 6 символов' };
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

  // Generate bonus account number
  const bonusAccount = `RZD${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone || null,
        birth_date: birthDate || null,
        bonus_account: bonusAccount,
      },
    },
  });

  if (error) {
    return { success: false, error: 'Ошибка при регистрации. Возможно, этот email уже используется.' };
  }

  // Create user record with bonus account
  const { error: userError } = await supabase.from('users').upsert({
    email,
    full_name: fullName,
    phone: phone || null,
    birth_date: birthDate || null,
    bonus_account: bonusAccount,
  }).select().single();

  if (userError) {
    console.error('Error creating user record:', userError);
  }

  // Create bonus account
  const { error: bonusError } = await supabase.from('bonus_accounts').insert({
    user_id: (await supabase.auth.getUser()).data.user?.id,
    account_number: bonusAccount,
    premium_balance: 0,
    qualification_balance: 0,
    level: 'base',
    level_progress: 0,
    total_miles: 0,
  });

  if (bonusError) {
    console.error('Error creating bonus account:', bonusError);
  }

  // Create default notification settings
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const topics = ['purchase', 'status_change', 'reminder', 'bonus_accrual', 'bonus_write_off', 'level_change', 'refund'];
    const channels = ['push', 'email', 'sms'];
    const settings = [];
    for (const topic of topics) {
      for (const channel of channels) {
        settings.push({
          user_id: user.id,
          channel,
          topic,
          enabled: channel === 'email', // Email enabled by default
        });
      }
    }
    await supabase.from('notification_settings').insert(settings);
  }

  // Automatically sign in after successful registration
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return {
      success: true,
      message:
        'Регистрация прошла успешно! Проверьте вашу почту для подтверждения.',
    };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/');
  redirect('/');
}

export async function resetPasswordAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();

  const email = formData.get('email') as string;

  if (!email) {
    return { success: false, error: 'Введите email для восстановления пароля' };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?redirect_to=/profile/reset-password`,
  });

  if (error) {
    return { success: false, error: 'Ошибка при отправке ссылки восстановления. Проверьте правильность email.' };
  }

  return { success: true, message: 'Ссылка для восстановления пароля отправлена на ваш email' };
}

export async function updatePasswordAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();

  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!newPassword || !confirmPassword) {
    return { success: false, error: 'Все поля обязательны' };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'Пароли не совпадают' };
  }

  if (newPassword.length < 6) {
    return { success: false, error: 'Пароль должен быть не менее 6 символов' };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { success: false, error: 'Ошибка при обновлении пароля. Попробуйте позже.' };
  }

  return { success: true, message: 'Пароль успешно изменён' };
}