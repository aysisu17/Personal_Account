// Database types for RZD Passenger Cabinet

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  birth_date: string | null;
  bonus_account: string | null; // Номер счёта «РЖД Бонус»
  created_at: string;
}

export interface Train {
  id: string;
  number: string;
  name: string;
  route: string;
  departure_time: string;
  arrival_time: string;
  type?: string;
  created_at: string;
}

export interface Station {
  id: string;
  name: string;
  city: string;
  address: string | null;
  created_at: string;
}

export type TicketStatus = 'paid' | 'pending_payment' | 'issued' | 'cancelled' | 'completed' | 'refund_requested' | 'refund_approved' | 'refund_rejected';

export interface Ticket {
  id: string;
  user_id: string;
  train_id: string;
  station_from_id: string;
  station_to_id: string;
  departure_date: string;
  arrival_date: string | null;
  seat_number: string;
  seat_type: 'lower' | 'upper' | 'side_lower' | 'side_upper' | 'seated';
  wagon_number: string;
  wagon_category: 'lux' | 'compartment' | 'economy' | 'seated' | 'second_class';
  price: number;
  discount_amount: number;
  bonus_used: number;
  bonus_earned: number;
  status: TicketStatus;
  is_electronic: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  ticket_id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// Бонусная система «РЖД Бонус»
export type BonusLevel = 'base' | 'silver' | 'gold' | 'platinum';

export interface BonusAccount {
  id: string;
  user_id: string;
  account_number: string;
  premium_balance: number;      // Премиальные баллы
  qualification_balance: number; // Квалификационные баллы
  level: BonusLevel;
  level_progress: number;       // Прогресс до следующего уровня (0-100)
  total_miles: number;          // Всего накоплено миль за всё время
  created_at: string;
  updated_at: string;
}

export interface BonusTransaction {
  id: string;
  user_id: string;
  account_id: string;
  type: 'accrual' | 'write_off';
  amount: number;
  balance_type: 'premium' | 'qualification';
  reason: 'trip' | 'promotion' | 'refund' | 'manual' | 'conversion';
  description: string;
  trip_id: string | null;
  created_at: string;
}

export interface BonusLevelInfo {
  level: BonusLevel;
  name: string;
  min_miles: number;
  max_miles: number | null;
  benefits: string[];
  multiplier: number; // Коэффициент начисления баллов
}

// Возврат билетов
export type RefundStatus = 'pending' | 'approved' | 'rejected';

export interface RefundRequest {
  id: string;
  user_id: string;
  ticket_id: string;
  reason: string;
  refund_amount: number;
  fee_amount: number;
  total_refund: number;
  card_number: string; // Маскированный номер карты
  status: RefundStatus;
  admin_comment: string | null;
  created_at: string;
  updated_at: string;
}

// Уведомления
export type NotificationChannel = 'push' | 'email' | 'sms';
export type NotificationTopic = 'purchase' | 'status_change' | 'reminder' | 'bonus_accrual' | 'bonus_write_off' | 'level_change' | 'refund';

export interface NotificationSetting {
  id: string;
  user_id: string;
  channel: NotificationChannel;
  topic: NotificationTopic;
  enabled: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  topic: NotificationTopic;
  read: boolean;
  created_at: string;
}

// Подписки
export interface Subscription {
  id: string;
  user_id: string;
  type: 'newsletter' | 'promotions' | 'survey';
  enabled: boolean;
}

// Привязанные карты
export interface LinkedCard {
  id: string;
  user_id: string;
  card_number: string; // Маскированный
  card_holder: string;
  expiry_date: string;
  is_default: boolean;
  created_at: string;
}

// Extended types with joined data
export interface TicketWithDetails extends Ticket {
  train: Train | null;
  station_from?: Station | null;
  station_to?: Station | null;
}

export interface BookingWithTicket extends Booking {
  ticket: TicketWithDetails;
}

export interface RefundWithTicket extends RefundRequest {
  ticket: TicketWithDetails;
}

export interface BonusAccountWithTransactions extends BonusAccount {
  transactions: BonusTransaction[];
}

// Константы для уровней программы лояльности
export const BONUS_LEVELS: BonusLevelInfo[] = [
  {
    level: 'base',
    name: 'Базовый',
    min_miles: 0,
    max_miles: 1999,
    benefits: ['Начисление баллов 1:1', 'Стандартная поддержка'],
    multiplier: 1,
  },
  {
    level: 'silver',
    name: 'Серебряный',
    min_miles: 2000,
    max_miles: 9999,
    benefits: ['Начисление баллов 1.25:1', 'Приоритетная поддержка', 'Бесплатный чай/кофе'],
    multiplier: 1.25,
  },
  {
    level: 'gold',
    name: 'Золотой',
    min_miles: 10000,
    max_miles: 49999,
    benefits: ['Начисление баллов 1.5:1', 'VIP-поддержка', 'Доступ в бизнес-залы', 'Приоритетная посадка'],
    multiplier: 1.5,
  },
  {
    level: 'platinum',
    name: 'Платиновый',
    min_miles: 50000,
    max_miles: null,
    benefits: ['Начисление баллов 2:1', 'Персональный менеджер', 'Доступ в бизнес-залы', 'Приоритетная посадка', 'Повышение класса вагона'],
    multiplier: 2,
  },
];

// Константы для категорий вагонов
export const WAGON_CATEGORIES: Record<string, string> = {
  lux: 'Люкс (СВ)',
  compartment: 'Купе',
  economy: 'Плацкарт',
  seated: 'Сидячий',
  second_class: 'Второй класс',
};

// Константы для типов мест
export const SEAT_TYPES: Record<string, string> = {
  lower: 'Нижнее',
  upper: 'Верхнее',
  side_lower: 'Боковое нижнее',
  side_upper: 'Боковое верхнее',
  seated: 'Сидячее',
};

// Константы для статусов билетов
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  paid: 'Оплачен',
  pending_payment: 'В ожидании оплаты',
  issued: 'Оформлен',
  cancelled: 'Отменён',
  completed: 'Поездка завершена',
  refund_requested: 'Запрошен возврат',
  refund_approved: 'Возврат одобрен',
  refund_rejected: 'Возврат отклонён',
};

export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  paid: 'bg-green-100 text-green-700',
  pending_payment: 'bg-yellow-100 text-yellow-700',
  issued: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-600',
  refund_requested: 'bg-purple-100 text-purple-700',
  refund_approved: 'bg-teal-100 text-teal-700',
  refund_rejected: 'bg-orange-100 text-orange-700',
};