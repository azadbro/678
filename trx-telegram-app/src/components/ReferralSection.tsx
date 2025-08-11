'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Share2, Copy, TrendingUp, UserPlus } from 'lucide-react'
import { useUserStore } from '@/store/userStore'
import { ApiService } from '@/lib/api'
import { telegram } from '@/lib/telegram'
import { Referral } from '@/types'
import toast from 'react-hot-toast'

export default function ReferralSection() {
  const { user } = useUserStore()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [referralStats, setReferralStats] = useState({ total: 0, verified: 0 })


  useEffect(() => {
    if (user) {
      loadReferralData()
    }
  }, [user])

  const loadReferralData = async () => {
    if (!user) return
    
    try {
      const [referralsData, statsData] = await Promise.all([
        ApiService.getUserReferrals(user.id),
        ApiService.getReferralStats(user.id)
      ])
      
      setReferrals(referralsData)
      setReferralStats(statsData)
    } catch (error) {
      console.error('Failed to load referral data:', error)
      toast.error('Failed to load referral data')
    }
  }

  const getReferralLink = () => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'
    return `${appUrl}?ref=${user?.telegram_id}`
  }

  const copyReferralLink = () => {
    const link = getReferralLink()
    navigator.clipboard.writeText(link)
    toast.success('Referral link copied!')
    telegram.hapticFeedback('light')
  }

  const shareReferralLink = () => {
    if (user) {
      telegram.shareReferralLink(user.telegram_id.toString())
      telegram.hapticFeedback('medium')
    }
  }

  const formatTRX = (amount: number) => {
    return amount.toFixed(6)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">Loading referral section...</div>
      </div>
    )
  }

  const totalCommissionEarned = referrals
    .filter(ref => ref.verified)
    .length * 0.05 // Initial bonus for each verified referral

  return (
    <div className="p-4 space-y-6">
      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-white" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Refer & Earn</h2>
          <p className="text-white/80 mb-4">
            Invite friends and earn 0.05 TRX + 10% of their withdrawals
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/20 rounded-lg p-3">
              <div className="text-lg font-bold">{referralStats.verified}</div>
              <div className="text-white/80 text-sm">Verified</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <div className="text-lg font-bold">{referralStats.total}</div>
              <div className="text-white/80 text-sm">Total Refs</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Referral Link Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <h3 className="font-semibold mb-4 flex items-center space-x-2">
          <Share2 size={18} className="text-blue-500" />
          <span>Your Referral Link</span>
        </h3>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="text-xs text-gray-500 mb-2">Referral Link</div>
          <div className="text-sm font-mono text-gray-800 break-all">
            {getReferralLink()}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={copyReferralLink}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <Copy size={18} />
            <span>Copy Link</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={shareReferralLink}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2"
          >
            <Share2 size={18} />
            <span>Share</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Referral Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-2xl p-6 text-white shadow-xl"
      >
        <h3 className="font-semibold mb-4">🎁 Referral Benefits</h3>
        
        <div className="space-y-4">
          <div className="bg-white/20 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <UserPlus size={20} />
              <span className="font-medium">Instant Bonus</span>
            </div>
            <div className="text-2xl font-bold">0.05 TRX</div>
            <div className="text-white/80 text-sm">When your referral watches 5 ads</div>
          </div>
          
          <div className="bg-white/20 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <TrendingUp size={20} />
              <span className="font-medium">Lifetime Commission</span>
            </div>
            <div className="text-2xl font-bold">10%</div>
            <div className="text-white/80 text-sm">Of all their future withdrawals</div>
          </div>
        </div>
      </motion.div>

      {/* Referral List */}
      {referrals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-4 shadow-lg"
        >
          <h3 className="font-semibold mb-4 flex items-center space-x-2">
            <Users size={18} className="text-purple-500" />
            <span>Your Referrals</span>
          </h3>
          
          <div className="space-y-3">
            {referrals.map((referral, index) => (
              <motion.div
                key={referral.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-lg border ${
                  referral.verified 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      referral.verified ? 'bg-green-500' : 'bg-yellow-500'
                    }`}>
                      {referral.referred?.first_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {referral.referred?.first_name} {referral.referred?.last_name}
                      </div>
                      {referral.referred?.username && (
                        <div className="text-sm text-gray-600">@{referral.referred.username}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      referral.verified 
                        ? 'text-green-700 bg-green-200' 
                        : 'text-yellow-700 bg-yellow-200'
                    }`}>
                      {referral.verified ? 'Verified ✓' : `${referral.referred?.ads_watched || 0}/5 ads`}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(referral.created_at)}
                    </div>
                  </div>
                </div>
                
                {referral.verified && (
                  <div className="mt-2 p-2 bg-green-100 rounded text-sm text-green-700">
                    ✅ Earned 0.05 TRX bonus + 10% commission on withdrawals
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* How Referrals Work */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <h3 className="font-semibold mb-4">🤝 How Referrals Work</h3>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              1
            </div>
            <div>
              <div className="font-medium text-gray-900">Share Your Link</div>
              <div className="text-sm text-gray-600">Send your unique referral link to friends</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              2
            </div>
            <div>
              <div className="font-medium text-gray-900">Friend Joins</div>
              <div className="text-sm text-gray-600">They sign up using your link</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              3
            </div>
            <div>
              <div className="font-medium text-gray-900">Verification Required</div>
              <div className="text-sm text-gray-600">They must watch 5 ads to verify</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              4
            </div>
            <div>
              <div className="font-medium text-gray-900">Earn Rewards</div>
              <div className="text-sm text-gray-600">Get 0.05 TRX + 10% of their withdrawals forever</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Earnings Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-pink-400 to-red-500 rounded-2xl p-6 text-white shadow-xl"
      >
        <h3 className="font-semibold mb-4">💰 Referral Earnings</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{formatTRX(totalCommissionEarned)}</div>
            <div className="text-white/80 text-sm">Bonus Earned</div>
          </div>
          
          <div className="bg-white/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">10%</div>
            <div className="text-white/80 text-sm">Commission Rate</div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-white/20 rounded-lg text-center">
          <div className="text-sm">
            💡 Each verified referral = <span className="font-bold">0.05 TRX</span> instant bonus
          </div>
        </div>
      </motion.div>

      {/* Empty State */}
      {referrals.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg text-center"
        >
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Start Referring Friends</h3>
          <p className="text-gray-600 text-sm mb-6">
            Share your referral link and earn TRX when friends join and start earning
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={copyReferralLink}
              className="bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
            >
              <Copy size={18} />
              <span>Copy</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={shareReferralLink}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <Share2 size={18} />
              <span>Share</span>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Referral Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <h3 className="font-semibold mb-4">🚀 Referral Tips</h3>
        
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">•</span>
            <span>Share in Telegram groups and channels for maximum reach</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">•</span>
            <span>Encourage friends to watch 5 ads quickly to verify your referral</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">•</span>
            <span>The more active your referrals, the more commission you earn</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">•</span>
            <span>Commission is paid automatically when they withdraw</span>
          </div>
        </div>
      </motion.div>

      {/* Potential Earnings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 text-white shadow-xl"
      >
        <h3 className="font-semibold mb-4">📈 Earning Potential</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span>5 verified referrals</span>
            <span className="font-bold">0.25 TRX (instant)</span>
          </div>
          <div className="flex justify-between items-center">
            <span>10 verified referrals</span>
            <span className="font-bold">0.5 TRX (instant)</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Each referral withdraws 10 TRX</span>
            <span className="font-bold">+1 TRX (commission)</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-white/20 rounded-lg text-center text-sm">
          💎 The more friends you refer, the more you earn passively!
        </div>
      </motion.div>
    </div>
  )
}