'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Toaster } from 'react-hot-toast'
import Layout from '@/components/Layout'
import WalletSection from '@/components/WalletSection'
import EarnSection from '@/components/EarnSection'
import TasksSection from '@/components/TasksSection'
import ReferralSection from '@/components/ReferralSection'
import { useUserStore, useAppStore } from '@/store/userStore'
import { ApiService } from '@/lib/api'
import { telegram } from '@/lib/telegram'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const { user, setUser, isLoading, setLoading, setError } = useUserStore()
  const { activeTab } = useAppStore()
  const [initializing, setInitializing] = useState(true)
  const searchParams = useSearchParams()

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      setLoading(true)
      
      // Initialize Telegram SDK
      await telegram.initialize()
      
      // Get Telegram user data
      const telegramUser = telegram.getTelegramUser()
      
      if (!telegramUser) {
        // For development/testing when not in Telegram
        if (process.env.NODE_ENV === 'development') {
          const mockUser = {
            id: 123456789,
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser'
          }
          await handleUserAuth(mockUser)
        } else {
          setError('Please open this app through Telegram')
          return
        }
      } else {
        await handleUserAuth(telegramUser)
      }
      
    } catch (error) {
      console.error('Failed to initialize app:', error)
      setError('Failed to initialize app')
    } finally {
      setLoading(false)
      setInitializing(false)
    }
  }

  const handleUserAuth = async (telegramUser: any) => {
    try {
      // Check for referral parameter
      const referralId = searchParams.get('ref')
      
      // Create or update user
      const userData = await ApiService.createOrUpdateUser(telegramUser, referralId || undefined)
      
      // Check if user is blocked
      if (userData.is_blocked) {
        setError('Your account has been blocked. Please contact support.')
        return
      }
      
      setUser(userData)
      
    } catch (error) {
      console.error('Failed to authenticate user:', error)
      setError('Failed to authenticate user')
    }
  }

  const renderActiveSection = () => {
    switch (activeTab) {
      case 'wallet':
        return <WalletSection />
      case 'earn':
        return <EarnSection />
      case 'tasks':
        return <TasksSection />
      case 'referral':
        return <ReferralSection />
      default:
        return <WalletSection />
    }
  }

  if (initializing || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 size={32} className="text-white animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">TRX Earn</h2>
          <p className="text-gray-600">Initializing your wallet...</p>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-sm w-full"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to TRX Earn</h2>
          <p className="text-gray-600 mb-6">
            Please open this app through Telegram to get started
          </p>
          <button
            onClick={initializeApp}
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <Layout>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderActiveSection()}
        </motion.div>
      </Layout>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px'
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff'
            }
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff'
            }
          }
        }}
      />
    </>
  )
}
