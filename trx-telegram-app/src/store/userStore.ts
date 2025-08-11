import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Transaction, Task, Withdrawal, Referral } from '@/types'

interface UserState {
  user: User | null
  isLoading: boolean
  error: string | null
  
  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateBalance: (amount: number) => void
  incrementAdsWatched: () => void
  updateLastAdWatch: () => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, error: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      updateBalance: (amount) => set((state) => ({
        user: state.user ? {
          ...state.user,
          trx_balance: Math.max(0, state.user.trx_balance + amount),
          total_earned: amount > 0 ? state.user.total_earned + amount : state.user.total_earned
        } : null
      })),
      
      incrementAdsWatched: () => set((state) => ({
        user: state.user ? {
          ...state.user,
          ads_watched: state.user.ads_watched + 1
        } : null
      })),
      
      updateLastAdWatch: () => set((state) => ({
        user: state.user ? {
          ...state.user,
          last_ad_watch: new Date().toISOString()
        } : null
      })),
      
      clearUser: () => set({ user: null, error: null })
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user })
    }
  )
)

interface AppState {
  activeTab: 'wallet' | 'earn' | 'tasks' | 'referral'
  transactions: Transaction[]
  tasks: Task[]
  completedTasks: string[]
  withdrawals: Withdrawal[]
  referrals: Referral[]
  
  // Actions
  setActiveTab: (tab: 'wallet' | 'earn' | 'tasks' | 'referral') => void
  setTransactions: (transactions: Transaction[]) => void
  setTasks: (tasks: Task[]) => void
  setCompletedTasks: (taskIds: string[]) => void
  addCompletedTask: (taskId: string) => void
  setWithdrawals: (withdrawals: Withdrawal[]) => void
  setReferrals: (referrals: Referral[]) => void
  addTransaction: (transaction: Transaction) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'wallet',
  transactions: [],
  tasks: [],
  completedTasks: [],
  withdrawals: [],
  referrals: [],
  
  setActiveTab: (activeTab) => set({ activeTab }),
  setTransactions: (transactions) => set({ transactions }),
  setTasks: (tasks) => set({ tasks }),
  setCompletedTasks: (completedTasks) => set({ completedTasks }),
  addCompletedTask: (taskId) => set((state) => ({
    completedTasks: [...state.completedTasks, taskId]
  })),
  setWithdrawals: (withdrawals) => set({ withdrawals }),
  setReferrals: (referrals) => set({ referrals }),
  addTransaction: (transaction) => set((state) => ({
    transactions: [transaction, ...state.transactions]
  }))
}))