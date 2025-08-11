import { supabase } from './supabase'
import { User, Task, Transaction, Withdrawal, Referral, TelegramUser } from '@/types'

export class ApiService {
  // User operations
  static async createOrUpdateUser(telegramUser: TelegramUser, referrerId?: string): Promise<User> {
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramUser.id)
      .single()

    if (existingUser) {
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update({
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          updated_at: new Date().toISOString()
        })
        .eq('telegram_id', telegramUser.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Create new user
      const userData: Partial<User> = {
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
      }

      // Handle referral
      if (referrerId) {
        const { data: referrer } = await supabase
          .from('users')
          .select('id')
          .eq('telegram_id', parseInt(referrerId))
          .single()

        if (referrer) {
          userData.referrer_id = referrer.id
        }
      }

      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single()

      if (error) throw error

      // Create referral record if there's a referrer
      if (referrerId && data.referrer_id) {
        await supabase
          .from('referrals')
          .insert({
            referrer_id: data.referrer_id,
            referred_id: data.id
          })
      }

      return data
    }
  }

  static async getUserByTelegramId(telegramId: number): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async updateUserWalletAddress(userId: string, walletAddress: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ trx_wallet_address: walletAddress })
      .eq('id', userId)

    if (error) throw error
  }

  // Ad operations
  static async canWatchAd(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('ad_views')
      .select('viewed_at')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(1)
      .single()

    if (!data) return true

    const lastAdTime = new Date(data.viewed_at)
    const now = new Date()
    const timeDiff = now.getTime() - lastAdTime.getTime()
    const cooldownMs = 15 * 1000 // 15 seconds

    return timeDiff >= cooldownMs
  }

  static async recordAdView(userId: string): Promise<void> {
    const canWatch = await this.canWatchAd(userId)
    if (!canWatch) {
      throw new Error('Cooldown period not finished')
    }

    // Record ad view
    const { error: adError } = await supabase
      .from('ad_views')
      .insert({
        user_id: userId,
        reward_amount: 0.005
      })

    if (adError) throw adError

    // Update user balance and ads watched
    const { error: userError } = await supabase
      .from('users')
      .update({
        trx_balance: supabase.raw('trx_balance + 0.005'),
        total_earned: supabase.raw('total_earned + 0.005'),
        ads_watched: supabase.raw('ads_watched + 1'),
        last_ad_watch: new Date().toISOString()
      })
      .eq('id', userId)

    if (userError) throw userError

    // Record transaction
    await this.createTransaction(userId, 'ad_watch', 0.005, 'Watched advertisement')

    // Check referral verification
    await this.checkReferralVerification(userId)
  }

  static async checkReferralVerification(userId: string): Promise<void> {
    const { data: user } = await supabase
      .from('users')
      .select('ads_watched, referrer_id, referral_verified')
      .eq('id', userId)
      .single()

    if (!user || user.referral_verified || !user.referrer_id || user.ads_watched < 5) {
      return
    }

    // Verify referral
    const { error: userError } = await supabase
      .from('users')
      .update({ referral_verified: true })
      .eq('id', userId)

    if (userError) throw userError

    // Update referral record
    const { error: referralError } = await supabase
      .from('referrals')
      .update({
        verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('referred_id', userId)

    if (referralError) throw referralError

    // Give referrer bonus
    const { error: bonusError } = await supabase
      .from('users')
      .update({
        trx_balance: supabase.raw('trx_balance + 0.05'),
        total_earned: supabase.raw('total_earned + 0.05')
      })
      .eq('id', user.referrer_id)

    if (bonusError) throw bonusError

    // Record referral bonus transaction
    await this.createTransaction(user.referrer_id, 'referral_bonus', 0.05, 'Referral verification bonus')
  }

  // Task operations
  static async getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getCompletedTasks(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_tasks')
      .select('task_id')
      .eq('user_id', userId)

    if (error) throw error
    return data?.map(item => item.task_id) || []
  }

  static async completeTask(userId: string, taskId: string): Promise<void> {
    // Check if task already completed
    const { data: existing } = await supabase
      .from('user_tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .single()

    if (existing) {
      throw new Error('Task already completed')
    }

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('is_active', true)
      .single()

    if (taskError || !task) throw new Error('Task not found')

    // Mark task as completed
    const { error: completionError } = await supabase
      .from('user_tasks')
      .insert({
        user_id: userId,
        task_id: taskId
      })

    if (completionError) throw completionError

    // Update user balance
    const { error: balanceError } = await supabase
      .from('users')
      .update({
        trx_balance: supabase.raw(`trx_balance + ${task.reward}`),
        total_earned: supabase.raw(`total_earned + ${task.reward}`)
      })
      .eq('id', userId)

    if (balanceError) throw balanceError

    // Record transaction
    await this.createTransaction(userId, 'task_completion', task.reward, `Completed task: ${task.title}`, taskId)
  }

  // Transaction operations
  static async createTransaction(
    userId: string,
    type: Transaction['transaction_type'],
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        transaction_type: type,
        amount,
        description,
        reference_id: referenceId
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  // Withdrawal operations
  static async requestWithdrawal(userId: string, amount: number, walletAddress: string): Promise<void> {
    // Check minimum withdrawal amount
    if (amount < 3.5) {
      throw new Error('Minimum withdrawal amount is 3.5 TRX')
    }

    // Check user balance
    const { data: user } = await supabase
      .from('users')
      .select('trx_balance')
      .eq('id', userId)
      .single()

    if (!user || user.trx_balance < amount) {
      throw new Error('Insufficient balance')
    }

    // Create withdrawal request
    const { error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: userId,
        amount,
        trx_wallet_address: walletAddress
      })

    if (withdrawalError) throw withdrawalError

    // Deduct from user balance
    const { error: balanceError } = await supabase
      .from('users')
      .update({
        trx_balance: supabase.raw(`trx_balance - ${amount}`)
      })
      .eq('id', userId)

    if (balanceError) throw balanceError

    // Record transaction
    await this.createTransaction(userId, 'withdrawal', -amount, `Withdrawal request: ${amount} TRX`)
  }

  static async getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Referral operations
  static async getUserReferrals(userId: string): Promise<Referral[]> {
    const { data, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referred:users!referrals_referred_id_fkey(telegram_id, first_name, last_name, username, ads_watched)
      `)
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getReferralStats(userId: string): Promise<{ total: number, verified: number }> {
    const { data, error } = await supabase
      .from('referrals')
      .select('verified')
      .eq('referrer_id', userId)

    if (error) throw error

    const total = data?.length || 0
    const verified = data?.filter(r => r.verified).length || 0

    return { total, verified }
  }

  // Admin operations
  static async getAllUsers(page = 1, limit = 50): Promise<{ users: User[], total: number }> {
    const offset = (page - 1) * limit

    const [usersResult, countResult] = await Promise.all([
      supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
    ])

    if (usersResult.error) throw usersResult.error
    if (countResult.error) throw countResult.error

    return {
      users: usersResult.data || [],
      total: countResult.count || 0
    }
  }

  static async getPendingWithdrawals(): Promise<Withdrawal[]> {
    const { data, error } = await supabase
      .from('withdrawals')
      .select(`
        *,
        user:users(telegram_id, first_name, last_name, username)
      `)
      .eq('status', 'pending')
      .order('requested_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async updateWithdrawalStatus(
    withdrawalId: string,
    status: 'approved' | 'rejected' | 'completed',
    adminNotes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('withdrawals')
      .update({
        status,
        admin_notes: adminNotes,
        processed_at: new Date().toISOString()
      })
      .eq('id', withdrawalId)

    if (error) throw error
  }

  static async blockUser(userId: string, blocked: boolean): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ is_blocked: blocked })
      .eq('id', userId)

    if (error) throw error
  }

  static async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)

    if (error) throw error
  }

  static async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({ is_active: false })
      .eq('id', taskId)

    if (error) throw error
  }

  // Utility functions
  static async getLastAdWatch(userId: string): Promise<Date | null> {
    const { data } = await supabase
      .from('ad_views')
      .select('viewed_at')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(1)
      .single()

    return data ? new Date(data.viewed_at) : null
  }

  static async processReferralCommission(referredUserId: string, withdrawalAmount: number): Promise<void> {
    // Get referrer info
    const { data: referredUser } = await supabase
      .from('users')
      .select('referrer_id, referral_verified')
      .eq('id', referredUserId)
      .single()

    if (!referredUser?.referrer_id || !referredUser.referral_verified) {
      return
    }

    const commission = withdrawalAmount * 0.1 // 10% commission

    // Add commission to referrer
    const { error: balanceError } = await supabase
      .from('users')
      .update({
        trx_balance: supabase.raw(`trx_balance + ${commission}`),
        total_earned: supabase.raw(`total_earned + ${commission}`)
      })
      .eq('id', referredUser.referrer_id)

    if (balanceError) throw balanceError

    // Record commission transaction
    await this.createTransaction(
      referredUser.referrer_id,
      'referral_commission',
      commission,
      `Referral commission from withdrawal: ${withdrawalAmount} TRX`,
      referredUserId
    )
  }
}