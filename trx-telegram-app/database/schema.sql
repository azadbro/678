-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  trx_wallet_address VARCHAR(255),
  trx_balance DECIMAL(18, 6) DEFAULT 0,
  total_earned DECIMAL(18, 6) DEFAULT 0,
  ads_watched INTEGER DEFAULT 0,
  last_ad_watch TIMESTAMP WITH TIME ZONE,
  referrer_id UUID REFERENCES users(id),
  referral_verified BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reward DECIMAL(18, 6) NOT NULL,
  task_type VARCHAR(50) NOT NULL, -- 'telegram_channel', 'telegram_bot', 'external'
  task_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User tasks (completed tasks)
CREATE TABLE user_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- Transactions table
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'ad_watch', 'task_completion', 'referral_bonus', 'referral_commission', 'withdrawal'
  amount DECIMAL(18, 6) NOT NULL,
  description TEXT,
  reference_id UUID, -- Can reference task_id, referral_id, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Withdrawals table
CREATE TABLE withdrawals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(18, 6) NOT NULL,
  trx_wallet_address VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
  admin_notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Referrals table
CREATE TABLE referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- Ad views table (for tracking cooldowns and verification)
CREATE TABLE ad_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reward_amount DECIMAL(18, 6) DEFAULT 0.005
);

-- Indexes for better performance
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_ad_views_user_time ON ad_views(user_id, viewed_at);

-- RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can only see their own data)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (telegram_id = current_setting('app.current_user_telegram_id')::BIGINT);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (telegram_id = current_setting('app.current_user_telegram_id')::BIGINT);

-- Insert default tasks
INSERT INTO tasks (title, description, reward, task_type, task_url) VALUES
('Join Our Telegram Channel', 'Join our main Telegram channel to stay updated', 0.01, 'telegram_channel', 'https://t.me/your_channel'),
('Follow Our News Channel', 'Follow our news channel for latest updates', 0.015, 'telegram_channel', 'https://t.me/your_news_channel'),
('Try Our Bot', 'Start our helper bot and explore features', 0.02, 'telegram_bot', 'https://t.me/your_bot');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();