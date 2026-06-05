-- Create trains table for RZD Passenger Cabinet
CREATE TABLE IF NOT EXISTS trains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL,
  name TEXT,
  route TEXT NOT NULL,
  departure_time TEXT NOT NULL,
  arrival_time TEXT NOT NULL,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create stations table
CREATE TABLE IF NOT EXISTS stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  train_id UUID NOT NULL REFERENCES trains(id) ON DELETE CASCADE,
  station_from_id TEXT,
  station_to_id TEXT,
  departure_date TEXT NOT NULL,
  arrival_date TEXT,
  seat_number TEXT,
  seat_type TEXT DEFAULT 'seated',
  wagon_number TEXT,
  wagon_category TEXT DEFAULT 'seated',
  price NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  bonus_used NUMERIC DEFAULT 0,
  bonus_earned NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'paid',
  is_electronic BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create bonus_accounts table
CREATE TABLE IF NOT EXISTS bonus_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  account_number TEXT NOT NULL UNIQUE,
  premium_balance NUMERIC DEFAULT 0,
  qualification_balance NUMERIC DEFAULT 0,
  level TEXT DEFAULT 'base',
  level_progress NUMERIC DEFAULT 0,
  total_miles NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create bonus_transactions table
CREATE TABLE IF NOT EXISTS bonus_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES bonus_accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  balance_type TEXT DEFAULT 'premium',
  reason TEXT NOT NULL,
  description TEXT,
  trip_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create refund_requests table
CREATE TABLE IF NOT EXISTS refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  refund_amount NUMERIC NOT NULL,
  fee_amount NUMERIC DEFAULT 0,
  total_refund NUMERIC NOT NULL,
  card_number TEXT,
  status TEXT DEFAULT 'pending',
  admin_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  topic TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  UNIQUE(user_id, channel, topic)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channel TEXT DEFAULT 'push',
  topic TEXT DEFAULT 'purchase',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  UNIQUE(user_id, type)
);

-- Create linked_cards table
CREATE TABLE IF NOT EXISTS linked_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_number TEXT NOT NULL,
  card_holder TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE trains ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE linked_cards ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to trains and stations
CREATE POLICY "Trains are viewable by everyone" ON trains FOR SELECT USING (true);
CREATE POLICY "Stations are viewable by everyone" ON stations FOR SELECT USING (true);

-- Create policies for authenticated users
CREATE POLICY "Users can view their own tickets" ON tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tickets" ON tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tickets" ON tickets FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own bonus account" ON bonus_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own bonus transactions" ON bonus_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own refund requests" ON refund_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own refund requests" ON refund_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own notification settings" ON notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notification settings" ON notification_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notification settings" ON notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own linked cards" ON linked_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own linked cards" ON linked_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own linked cards" ON linked_cards FOR DELETE USING (auth.uid() = user_id);