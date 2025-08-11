'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap, Play, Clock, TrendingUp } from 'lucide-react'
import { useUserStore } from '@/store/userStore'
import { ApiService } from '@/lib/api'
import { telegram } from '@/lib/telegram'
import toast from 'react-hot-toast'

export default function EarnSection() {
  const { user, updateBalance, incrementAdsWatched, updateLastAdWatch } = useUserStore()
  const [canWatchAd, setCanWatchAd] = useState(true)
  const [cooldownTime, setCooldownTime] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      checkAdCooldown()
    }
  }, [user])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (cooldownTime > 0) {
      interval = setInterval(() => {
        setCooldownTime(prev => {
          if (prev <= 1) {
            setCanWatchAd(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [cooldownTime])

  const checkAdCooldown = async () => {
    if (!user) return

    try {
      const canWatch = await ApiService.canWatchAd(user.id)
      setCanWatchAd(canWatch)

      if (!canWatch) {
        const lastAdTime = await ApiService.getLastAdWatch(user.id)
        if (lastAdTime) {
          const now = new Date()
          const timeDiff = now.getTime() - lastAdTime.getTime()
          const remainingMs = (15 * 1000) - timeDiff
          if (remainingMs > 0) {
            setCooldownTime(Math.ceil(remainingMs / 1000))
          }
        }
      }
    } catch (error) {
      console.error('Failed to check ad cooldown:', error)
    }
  }

  const watchAd = async () => {
    if (!user || !canWatchAd || loading) return

    setLoading(true)
    try {
      // Simulate ad loading and viewing
      toast.loading('Loading advertisement...', { id: 'ad-loading' })
      
      // Simulate ad duration (3-5 seconds)
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Record ad view and update balance
      await ApiService.recordAdView(user.id)
      
      // Update local state
      updateBalance(0.005)
      incrementAdsWatched()
      updateLastAdWatch()
      
      // Set cooldown
      setCanWatchAd(false)
      setCooldownTime(15)
      
      toast.dismiss('ad-loading')
      toast.success('🎉 You earned 0.005 TRX!')
      telegram.hapticFeedback('medium')
      
    } catch (error) {
      toast.dismiss('ad-loading')
      toast.error((error as Error).message || 'Failed to process ad view')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    return `${seconds}s`
  }

  const formatTRX = (amount: number) => {
    return amount.toFixed(6)
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">Loading earn section...</div>
      </div>
    )
  }



  return (
    <div className="p-4 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-4 shadow-lg"
        >
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp size={18} className="text-green-500" />
            <span className="text-sm text-gray-600">Total Earned</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatTRX(user.total_earned)} TRX
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-4 shadow-lg"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Zap size={18} className="text-orange-500" />
            <span className="text-sm text-gray-600">Ads Watched</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {user.ads_watched}
          </div>
        </motion.div>
      </div>

      {/* Main Earn Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play size={32} className="text-white ml-1" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Watch & Earn</h2>
          <p className="text-white/80 mb-6">
            Watch advertisements and earn 0.005 TRX instantly
          </p>

          {canWatchAd ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={watchAd}
              disabled={loading}
              className="bg-white text-purple-600 py-4 px-8 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading Ad...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Play size={20} />
                  <span>Watch Ad (+0.005 TRX)</span>
                </div>
              )}
            </motion.button>
          ) : (
            <div className="bg-white/20 py-4 px-8 rounded-xl">
              <div className="flex items-center justify-center space-x-2 text-white/80">
                <Clock size={20} />
                <span>Cooldown: {formatTime(cooldownTime)}</span>
              </div>
              <div className="text-xs text-white/60 mt-2">
                Next ad available in {formatTime(cooldownTime)}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <h3 className="font-semibold mb-4 flex items-center space-x-2">
          <Zap size={18} className="text-orange-500" />
          <span>How It Works</span>
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              1
            </div>
            <div>
              <div className="font-medium text-gray-900">Watch Advertisement</div>
              <div className="text-sm text-gray-600">View a short video ad completely</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              2
            </div>
            <div>
              <div className="font-medium text-gray-900">Earn TRX Instantly</div>
              <div className="text-sm text-gray-600">Receive 0.005 TRX immediately after completion</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              3
            </div>
            <div>
              <div className="font-medium text-gray-900">Wait 15 Seconds</div>
              <div className="text-sm text-gray-600">Short cooldown before next ad</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Earning Potential */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl p-6 text-white shadow-xl"
      >
        <h3 className="font-semibold mb-4">💡 Earning Potential</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">0.3 TRX</div>
            <div className="text-white/80 text-sm">Per Hour</div>
            <div className="text-xs text-white/60">(60 ads)</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold">7.2 TRX</div>
            <div className="text-white/80 text-sm">Per Day</div>
            <div className="text-xs text-white/60">(1440 ads)</div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-white/20 rounded-lg">
          <div className="text-xs text-white/80 text-center">
            💎 Complete tasks and refer friends to earn even more!
          </div>
        </div>
      </motion.div>

      {/* Recent Ad Views */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-4 shadow-lg"
      >
        <h3 className="font-semibold mb-3">📊 Your Progress Today</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Ads Watched</span>
            <span className="font-semibold">{user.ads_watched}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">TRX Earned from Ads</span>
            <span className="font-semibold text-green-600">
              +{formatTRX(user.ads_watched * 0.005)} TRX
            </span>
          </div>
          
          {user.last_ad_watch && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last Ad Watched</span>
              <span className="text-sm text-gray-500">
                {new Date(user.last_ad_watch).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}