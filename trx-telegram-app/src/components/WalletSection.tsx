'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wallet, Copy, Send, History, Settings } from 'lucide-react'
import { useUserStore } from '@/store/userStore'
import { ApiService } from '@/lib/api'
import { telegram } from '@/lib/telegram'
import { Transaction, Withdrawal } from '@/types'
import toast from 'react-hot-toast'

export default function WalletSection() {
  const { user, updateBalance } = useUserStore()
  const [showWalletInput, setShowWalletInput] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [showWithdrawal, setShowWithdrawal] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setWalletAddress(user.trx_wallet_address || '')
      loadTransactions()
      loadWithdrawals()
    }
  }, [user])

  const loadTransactions = async () => {
    if (!user) return
    try {
      const data = await ApiService.getUserTransactions(user.id, 10)
      setTransactions(data)
    } catch (error) {
      console.error('Failed to load transactions:', error)
    }
  }

  const loadWithdrawals = async () => {
    if (!user) return
    try {
      const data = await ApiService.getUserWithdrawals(user.id)
      setWithdrawals(data)
    } catch (error) {
      console.error('Failed to load withdrawals:', error)
    }
  }

  const handleSaveWallet = async () => {
    if (!user || !walletAddress.trim()) return

    // Basic TRX address validation
    if (!walletAddress.startsWith('T') || walletAddress.length !== 34) {
      toast.error('Invalid TRX wallet address')
      return
    }

    setLoading(true)
    try {
      await ApiService.updateUserWalletAddress(user.id, walletAddress.trim())
      toast.success('Wallet address updated successfully!')
      setShowWalletInput(false)
      telegram.hapticFeedback('medium')
    } catch (error) {
      toast.error('Failed to update wallet address')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawal = async () => {
    if (!user || !walletAddress.trim() || !withdrawalAmount) return

    const amount = parseFloat(withdrawalAmount)
    if (isNaN(amount) || amount < 3.5) {
      toast.error('Minimum withdrawal amount is 3.5 TRX')
      return
    }

    if (amount > user.trx_balance) {
      toast.error('Insufficient balance')
      return
    }

    const confirmed = await telegram.showConfirm(
      `Are you sure you want to withdraw ${amount} TRX to ${walletAddress}?`
    )

    if (!confirmed) return

    setLoading(true)
    try {
      await ApiService.requestWithdrawal(user.id, amount, walletAddress)
      updateBalance(-amount)
      toast.success('Withdrawal request submitted successfully!')
      setShowWithdrawal(false)
      setWithdrawalAmount('')
      loadWithdrawals()
      telegram.hapticFeedback('medium')
    } catch (error: any) {
      toast.error(error.message || 'Failed to process withdrawal')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
    telegram.hapticFeedback('light')
  }

  const formatTRX = (amount: number) => {
    return amount.toFixed(6)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'ad_watch':
        return '📺'
      case 'task_completion':
        return '✅'
      case 'referral_bonus':
        return '🎁'
      case 'referral_commission':
        return '💰'
      case 'withdrawal':
        return '📤'
      default:
        return '💳'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'approved':
        return 'text-blue-600 bg-blue-100'
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'rejected':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">Loading wallet...</div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Wallet size={24} />
            <span className="text-lg font-semibold">TRX Balance</span>
          </div>
          <button
            onClick={() => setShowWalletInput(!showWalletInput)}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>
        
        <div className="space-y-2">
          <div className="text-3xl font-bold">{formatTRX(user.trx_balance)} TRX</div>
          <div className="text-white/80 text-sm">
            Total Earned: {formatTRX(user.total_earned)} TRX
          </div>
        </div>

        {user.trx_wallet_address && (
          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white/60 mb-1">Wallet Address</div>
                <div className="text-sm font-mono truncate">
                  {user.trx_wallet_address}
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(user.trx_wallet_address!)}
                className="ml-2 p-1 hover:bg-white/20 rounded"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Wallet Address Input */}
      {showWalletInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-2xl p-4 shadow-lg"
        >
          <h3 className="font-semibold mb-3">Set TRX Wallet Address</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter your TRX wallet address (starts with T)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSaveWallet}
                disabled={loading || !walletAddress.trim()}
                className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50 hover:shadow-lg transition-all"
              >
                {loading ? 'Saving...' : 'Save Address'}
              </button>
              <button
                onClick={() => setShowWalletInput(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowWithdrawal(true)}
          disabled={!user.trx_wallet_address || user.trx_balance < 3.5}
          className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center space-x-2 text-gray-700">
            <Send size={20} />
            <span className="font-medium">Withdraw</span>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={loadTransactions}
          className="bg-white p-4 rounded-xl shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-center space-x-2 text-gray-700">
            <History size={20} />
            <span className="font-medium">History</span>
          </div>
        </motion.button>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm"
          >
            <h3 className="text-lg font-semibold mb-4">Withdraw TRX</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Amount (min 3.5 TRX)</label>
                <input
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder="0.000000"
                  step="0.000001"
                  min="3.5"
                  max={user.trx_balance}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Available: {formatTRX(user.trx_balance)} TRX
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleWithdrawal}
                  disabled={loading || !withdrawalAmount || parseFloat(withdrawalAmount) < 3.5}
                  className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Withdraw'}
                </button>
                <button
                  onClick={() => setShowWithdrawal(false)}
                  className="px-4 py-3 text-gray-600 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 shadow-lg"
        >
          <h3 className="font-semibold mb-3 flex items-center space-x-2">
            <History size={18} />
            <span>Recent Transactions</span>
          </h3>
          <div className="space-y-2">
            {transactions.slice(0, 5).map((tx, index) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getTransactionIcon(tx.transaction_type)}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{tx.description}</div>
                    <div className="text-xs text-gray-500">{formatDate(tx.created_at)}</div>
                  </div>
                </div>
                <div className={`text-sm font-semibold ${
                  tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {tx.amount > 0 ? '+' : ''}{formatTRX(tx.amount)} TRX
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Withdrawal Status */}
      {withdrawals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 shadow-lg"
        >
          <h3 className="font-semibold mb-3 flex items-center space-x-2">
            <Send size={18} />
            <span>Withdrawal Status</span>
          </h3>
          <div className="space-y-2">
            {withdrawals.slice(0, 3).map((withdrawal) => (
              <div key={withdrawal.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{formatTRX(withdrawal.amount)} TRX</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                    {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(withdrawal.requested_at)}
                </div>
                {withdrawal.admin_notes && (
                  <div className="text-xs text-gray-600 mt-1 p-2 bg-gray-100 rounded">
                    {withdrawal.admin_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!user.trx_wallet_address && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg text-center"
        >
          <Wallet size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Set Your TRX Wallet</h3>
          <p className="text-gray-600 text-sm mb-4">
            Add your TRX wallet address to start earning and withdraw your rewards
          </p>
          <button
            onClick={() => setShowWalletInput(true)}
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white py-2 px-6 rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Add Wallet Address
          </button>
        </motion.div>
      )}
    </div>
  )
}