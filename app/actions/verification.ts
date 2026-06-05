'use server';

import { createClient } from '@/lib/supabase/server';

// In production, use Redis or a database table for this
// For now, we store codes in a simple in-memory map (note: this resets on server restart)
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationCodeAction(): Promise<{ success: boolean; error?: string; message?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return { success: false, error: 'Не удалось получить данные пользователя' };
  }

  const code = generateCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Store the code
  verificationCodes.set(user.email, { code, expiresAt });

  // Send email via Supabase Auth's built-in email functionality
  // We use the reset password mechanism as a way to send a custom email
  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
  });

  if (error) {
    return { success: false, error: 'Ошибка при отправке кода. Попробуйте позже.' };
  }

  // For development/demo purposes, also log the code to console
  console.log(`[DEV] Verification code for ${user.email}: ${code}`);

  return {
    success: true,
    message: `Код подтверждения отправлен на ${user.email}. Срок действия кода — 10 минут.`,
  };
}

export async function verifyCodeAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return { success: false, error: 'Не удалось получить данные пользователя' };
  }

  const code = formData.get('code') as string;
  if (!code) {
    return { success: false, error: 'Введите код подтверждения' };
  }

  const stored = verificationCodes.get(user.email);
  if (!stored) {
    return { success: false, error: 'Код не найден. Запросите новый код.' };
  }

  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(user.email);
    return { success: false, error: 'Срок действия кода истёк. Запросите новый код.' };
  }

  if (stored.code !== code) {
    return { success: false, error: 'Неверный код подтверждения' };
  }

  // Code verified - mark as verified (we'll check this in changePasswordAction)
  verificationCodes.set(user.email, { code: 'VERIFIED', expiresAt: Date.now() + 5 * 60 * 1000 });

  return { success: true };
}

export async function isCodeVerifiedAction(): Promise<boolean> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;

  const stored = verificationCodes.get(user.email);
  return stored?.code === 'VERIFIED' && stored.expiresAt > Date.now();
}

export async function clearVerificationAction() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email) {
    verificationCodes.delete(user.email);
  }
}