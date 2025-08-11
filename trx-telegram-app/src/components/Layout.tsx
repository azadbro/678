'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wallet, Zap, CheckSquare, Users } from 'lucide-react'
import { useAppStore } from '@/store/userStore'
import { telegram } from '@/lib/telegram'

interface LayoutProps {
  children: React.ReactNode
}

const tabs = [
  { id: 'wallet' as const, label: 'Wallet', icon: Wallet },
  { id: 'earn' as const, label: 'Earn', icon: Zap },
  { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare },
  { id: 'referral' as const, label: 'Referral', icon: Users },
]

export default function Layout({ children }: LayoutProps) {
  const { activeTab, setActiveTab } = useAppStore()

  useEffect(() => {
    // Initialize Telegram WebApp
    telegram.initialize().catch(console.error)
    telegram.expandWebApp()
  }, [])

  const handleTabChange = (tabId: typeof activeTab) => {
    setActiveTab(tabId)
    telegram.hapticFeedback('light')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                TRX Earn
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200">
        <div className="max-w-md mx-auto px-2 py-2">
          <div className="flex justify-around">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[70px]"
                >
                  <div className={`relative p-2 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 shadow-lg' 
                      : 'hover:bg-gray-100'
                  }`}>
                    <Icon 
                      size={20} 
                      className={`transition-colors duration-200 ${
                        isActive ? 'text-white' : 'text-gray-600'
                      }`} 
                    />
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl"
                        layoutId="activeTab"
                        style={{ zIndex: -1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </div>
                  <span className={`text-xs mt-1 font-medium transition-colors duration-200 ${
                    isActive 
                      ? 'text-red-600' 
                      : 'text-gray-600'
                  }`}>
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}