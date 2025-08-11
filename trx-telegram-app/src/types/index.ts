export interface User {
  id: string
  telegram_id: number
  username?: string
  first_name?: string
  last_name?: string
  trx_wallet_address?: string
  trx_balance: number
  total_earned: number
  ads_watched: number
  last_ad_watch?: string
  referrer_id?: string
  referral_verified: boolean
  is_blocked: boolean
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  reward: number
  task_type: 'telegram_channel' | 'telegram_bot' | 'external'
  task_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserTask {
  id: string
  user_id: string
  task_id: string
  completed_at: string
}

export interface Transaction {
  id: string
  user_id: string
  transaction_type: 'ad_watch' | 'task_completion' | 'referral_bonus' | 'referral_commission' | 'withdrawal'
  amount: number
  description?: string
  reference_id?: string
  created_at: string
}

export interface Withdrawal {
  id: string
  user_id: string
  amount: number
  trx_wallet_address: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  admin_notes?: string
  requested_at: string
  processed_at?: string
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  verified: boolean
  verified_at?: string
  created_at: string
}

export interface AdView {
  id: string
  user_id: string
  viewed_at: string
  reward_amount: number
}

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}