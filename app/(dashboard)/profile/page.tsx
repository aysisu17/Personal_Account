'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { updateProfileAction, changePasswordAction, linkCardAction, unlinkCardAction, getLinkedCards, updateSubscriptionAction, getSubscriptions } from '@/app/actions/profile';
import { getNotificationSettings, updateNotificationSettingAction } from '@/app/actions/notifications';
import { sendVerificationCodeAction, verifyCodeAction } from '@/app/actions/verification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Calendar, CreditCard, Bell, Lock, Shield, Plus, Trash2, KeyRound } from 'lucide-react';

const topicLabels: Record<string, string> = {
  purchase: 'Покупка билета',
  status_change: 'Изменение статуса билета',
  reminder: 'Напоминание о поездке',
  bonus_accrual: 'Начисление баллов',
  bonus_write_off: 'Списание баллов',
  level_change: 'Изменение уровня',
  refund: 'Возврат',
};

const channelLabels: Record<string, string> = {
  push: 'Push-уведомления',
  email: 'Email',
  sms: 'SMS',
};

const subscriptionLabels: Record<string, string> = {
  newsletter: 'Новостная рассылка',
  promotions: 'Акции и спецпредложения',
  survey: 'Опросы и исследования',
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Profile form
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profilePending, setProfilePending] = useState(false);

  // Password change
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordPending, setPasswordPending] = useState(false);

  // Verification code
  const [showVerification, setShowVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [verificationPending, setVerificationPending] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);

  // Cards
  const [cards, setCards] = useState<any[]>([]);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardSuccess, setCardSuccess] = useState<string | null>(null);
  const [cardPending, setCardPending] = useState(false);

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<any[]>([]);

  // Subscriptions
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const [cardsData, settingsData, subsData] = await Promise.all([
          getLinkedCards(),
          getNotificationSettings(),
          getSubscriptions(),
        ]);
        setCards(cardsData);
        setNotificationSettings(settingsData);
        setSubscriptions(subsData);
      }

      setLoading(false);
    }
    loadData();
  }, []);

  async function handleProfileSubmit(formData: FormData) {
    setProfilePending(true);
    setProfileError(null);
    setProfileSuccess(null);

    const result = await updateProfileAction(undefined, formData);

    if (result?.error) {
      setProfileError(result.error);
    } else if (result?.success && result.message) {
      setProfileSuccess(result.message);
    }

    setProfilePending(false);
  }

  async function handleSendCode() {
    setVerificationPending(true);
    setVerificationError(null);
    setVerificationMessage(null);

    const result = await sendVerificationCodeAction();

    if (result?.error) {
      setVerificationError(result.error);
    } else if (result?.message) {
      setVerificationMessage(result.message);
      setVerificationSent(true);
    }

    setVerificationPending(false);
  }

  async function handleVerifyCode() {
    setVerificationPending(true);
    setVerificationError(null);

    const formData = new FormData();
    formData.set('code', verificationCode);

    const result = await verifyCodeAction(formData);

    if (result?.error) {
      setVerificationError(result.error);
    } else if (result?.success) {
      setCodeVerified(true);
      setVerificationMessage('Код подтверждён. Теперь вы можете сменить пароль.');
    }

    setVerificationPending(false);
  }

  async function handlePasswordSubmit(formData: FormData) {
    setPasswordPending(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    const result = await changePasswordAction(undefined, formData);

    if (result?.error) {
      setPasswordError(result.error);
    } else if (result?.success && result.message) {
      setPasswordSuccess(result.message);
      setShowVerification(false);
      setVerificationSent(false);
      setVerificationCode('');
      setCodeVerified(false);
      setVerificationMessage(null);
    }

    setPasswordPending(false);
  }

  async function handleCardSubmit(formData: FormData) {
    setCardPending(true);
    setCardError(null);
    setCardSuccess(null);

    const result = await linkCardAction(undefined, formData);

    if (result?.error) {
      setCardError(result.error);
    } else if (result?.success && result.message) {
      setCardSuccess(result.message);
      const cardsData = await getLinkedCards();
      setCards(cardsData);
      setShowCardForm(false);
    }

    setCardPending(false);
  }

  async function handleUnlinkCard(cardId: string) {
    if (!confirm('Вы уверены, что хотите отвязать карту?')) return;
    await unlinkCardAction(cardId);
    const cardsData = await getLinkedCards();
    setCards(cardsData);
  }

  async function handleNotificationToggle(settingId: string, enabled: boolean) {
    await updateNotificationSettingAction(settingId, enabled);
    setNotificationSettings(prev =>
      prev.map(s => s.id === settingId ? { ...s, enabled } : s)
    );
  }

  async function handleSubscriptionToggle(subscriptionId: string, enabled: boolean) {
    await updateSubscriptionAction(subscriptionId, enabled);
    setSubscriptions(prev =>
      prev.map(s => s.id === subscriptionId ? { ...s, enabled } : s)
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Профиль</h1>
        <p className="text-gray-500 mt-1">
          Управление личными данными и настройками
        </p>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {user?.user_metadata?.full_name || 'Пассажир'}
            </p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {user?.user_metadata?.bonus_account && (
              <p className="text-xs text-red-600">
                Счёт РЖД Бонус: {user.user_metadata.bonus_account}
              </p>
            )}
          </div>
        </div>

        <form action={handleProfileSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">ФИО</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              defaultValue={user?.user_metadata?.full_name || ''}
              placeholder="Иванов Иван Иванович"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                className="pl-10"
                disabled
              />
            </div>
            <p className="text-xs text-gray-400">Email нельзя изменить</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Телефон</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={user?.user_metadata?.phone || ''}
                placeholder="+7 (999) 123-45-67"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Дата рождения</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                defaultValue={user?.user_metadata?.birth_date || ''}
                className="pl-10"
              />
            </div>
          </div>

          {profileError && (
            <p className="text-sm text-red-500">{profileError}</p>
          )}
          {profileSuccess && (
            <p className="text-sm text-green-600">{profileSuccess}</p>
          )}

          <Button type="submit" className="w-full" disabled={profilePending}>
            {profilePending ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Смена пароля</h2>
        </div>

        {!showVerification ? (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Для смены пароля необходимо подтвердить вашу личность через код, отправленный на email.
            </p>
            <Button
              type="button"
              onClick={() => setShowVerification(true)}
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Начать смену пароля
            </Button>
          </div>
        ) : (
          <>
            {/* Verification Step */}
            {!codeVerified && (
              <div className="space-y-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-red-600" />
                  <h3 className="font-medium text-gray-900">Подтверждение по email</h3>
                </div>
                <p className="text-sm text-gray-500">
                  На ваш email будет отправлен код подтверждения. Введите его ниже.
                </p>

                {!verificationSent ? (
                  <Button
                    type="button"
                    onClick={handleSendCode}
                    disabled={verificationPending}
                    variant="outline"
                  >
                    {verificationPending ? 'Отправка...' : 'Отправить код на email'}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="verificationCode">Код подтверждения</Label>
                      <Input
                        id="verificationCode"
                        type="text"
                        placeholder="Введите 6-значный код"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        maxLength={6}
                        className="text-center text-lg tracking-widest"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={verificationPending || verificationCode.length !== 6}
                      className="w-full"
                    >
                      {verificationPending ? 'Проверка...' : 'Подтвердить код'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setVerificationSent(false);
                        setVerificationError(null);
                        setVerificationMessage(null);
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Отправить код заново
                    </button>
                  </div>
                )}

                {verificationError && (
                  <p className="text-sm text-red-500">{verificationError}</p>
                )}
                {verificationMessage && (
                  <p className="text-sm text-green-600">{verificationMessage}</p>
                )}
              </div>
            )}

            {/* Password Change Form - shown after verification */}
            {codeVerified && (
              <form action={handlePasswordSubmit} className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200 mb-4">
                  <span className="text-sm text-green-700">✓ Код подтверждён. Теперь вы можете сменить пароль.</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Текущий пароль</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Новый пароль</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="Минимум 6 символов"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Подтвердите новый пароль</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {passwordError && (
                  <p className="text-sm text-red-500">{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="text-sm text-green-600">{passwordSuccess}</p>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={passwordPending}>
                    {passwordPending ? 'Смена...' : 'Сменить пароль'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowVerification(false);
                      setVerificationSent(false);
                      setVerificationCode('');
                      setCodeVerified(false);
                      setVerificationError(null);
                      setVerificationMessage(null);
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </div>

      {/* Linked Cards */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Привязанные карты</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowCardForm(!showCardForm)}>
            <Plus className="w-4 h-4 mr-1" />
            Добавить карту
          </Button>
        </div>

        {cards.length > 0 && (
          <div className="space-y-2 mb-4">
            {cards.map((card: any) => (
              <div key={card.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{card.card_number}</p>
                    <p className="text-xs text-gray-500">{card.card_holder} · {card.expiry_date}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnlinkCard(card.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showCardForm && (
          <form action={handleCardSubmit} className="space-y-4 border-t border-gray-200 pt-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Номер карты</Label>
              <Input
                id="cardNumber"
                name="cardNumber"
                placeholder="1234 5678 9012 3456"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cardHolder">Держатель карты</Label>
                <Input
                  id="cardHolder"
                  name="cardHolder"
                  placeholder="IVAN IVANOV"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Срок действия</Label>
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  placeholder="ММ/ГГ"
                  required
                />
              </div>
            </div>

            {cardError && <p className="text-sm text-red-500">{cardError}</p>}
            {cardSuccess && <p className="text-sm text-green-600">{cardSuccess}</p>}

            <Button type="submit" disabled={cardPending}>
              {cardPending ? 'Привязка...' : 'Привязать карту'}
            </Button>
          </form>
        )}
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Настройки уведомлений</h2>
        </div>

        <div className="space-y-4">
          {(['push', 'email', 'sms'] as const).map((channel) => (
            <div key={channel}>
              <p className="text-sm font-medium text-gray-700 mb-2">{channelLabels[channel]}</p>
              <div className="space-y-2">
                {Object.entries(topicLabels).map(([topic, label]) => {
                  const setting = notificationSettings.find(
                    (s: any) => s.channel === channel && s.topic === topic
                  );
                  if (!setting) return null;

                  return (
                    <label
                      key={setting.id}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm text-gray-600">{label}</span>
                      <button
                        type="button"
                        onClick={() => handleNotificationToggle(setting.id, !setting.enabled)}
                        className={`relative w-10 h-6 rounded-full transition-colors ${
                          setting.enabled ? 'bg-red-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            setting.enabled ? 'translate-x-4' : ''
                          }`}
                        />
                      </button>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscriptions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Подписки на рассылки</h2>
        </div>

        <div className="space-y-3">
          {subscriptions.length > 0 ? (
            subscriptions.map((sub: any) => (
              <label
                key={sub.id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {subscriptionLabels[sub.type] || sub.type}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSubscriptionToggle(sub.id, !sub.enabled)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    sub.enabled ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      sub.enabled ? 'translate-x-4' : ''
                    }`}
                  />
                </button>
              </label>
            ))
          ) : (
            <p className="text-sm text-gray-500">Нет доступных подписок</p>
          )}
        </div>
      </div>
    </div>
  );
}